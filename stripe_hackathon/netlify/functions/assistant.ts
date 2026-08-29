import { AREAS } from "../../lib/areas";
import {
  isRecord,
  validateAssistantRequest,
  validateClassification,
} from "../../lib/assistant";
import type {
  AssistantClassification,
  AssistantEvent,
  AssistantRequest,
} from "../../lib/assistant";
import { ASSISTANT_SAFETY } from "../../lib/assistant-safety";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "z-ai/glm-5.3-flash";
const MAX_BODY_BYTES = 64 * 1024;
const AREA_IDS = AREAS.map((area) => area.id);
const REPORT_KINDS = ["on", "off", "unsure"] as const;

export const config = {
  path: "/api/assistant",
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
};

function jsonError(error: AssistantEvent & { type: "error" }, status: number) {
  return Response.json(
    { error: error.code },
    { status, headers: { "cache-control": "no-store" } },
  );
}

function encodeEvent(event: AssistantEvent): Uint8Array {
  const encoder = new TextEncoder();
  if (event.type === "delta") {
    return encoder.encode(`event: delta\ndata: ${JSON.stringify({ text: event.text })}\n\n`);
  }
  if (event.type === "report_draft") {
    return encoder.encode(
      `event: report_draft\ndata: ${JSON.stringify({
        areaId: event.areaId,
        kind: event.kind,
      })}\n\n`,
    );
  }
  if (event.type === "error") {
    return encoder.encode(`event: error\ndata: ${JSON.stringify({ code: event.code })}\n\n`);
  }
  return encoder.encode("event: done\ndata: {}\n\n");
}

function eventStream(events: AssistantEvent[]): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const event of events) controller.enqueue(encodeEvent(event));
        controller.close();
      },
    }),
    {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

function providerRequest(
  apiKey: string,
  body: Record<string, unknown>,
): RequestInit {
  return {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  };
}

function classifierBody(model: string, request: AssistantRequest) {
  return {
    model,
    messages: [
      {
        role: "system",
        content:
          "Classify the message for Batti. Use only the supplied Area IDs. A Report must have an on, off, or unsure reportKind; all other intents must use null.",
      },
      {
        role: "user",
        content: JSON.stringify({
          selectedAreaId: request.selectedAreaId,
          history: request.history.map(({ role, content }) => ({ role, content })),
          message: request.message,
        }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "batti_assistant_classification",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["intent", "areaId", "reportKind", "language"],
          properties: {
            intent: { type: "string", enum: ["question", "report", "off_topic"] },
            areaId: { type: "string", enum: AREA_IDS },
            reportKind: {
              anyOf: [
                { type: "string", enum: REPORT_KINDS },
                { type: "null" },
              ],
            },
            language: { type: "string", enum: ["bn", "en", "mixed"] },
          },
        },
      },
    },
  };
}

function parseClassification(
  payload: unknown,
  request: AssistantRequest,
): AssistantClassification | null {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return null;
  const first = payload.choices[0];
  if (!isRecord(first) || !isRecord(first.message)) return null;
  if (typeof first.message.content !== "string") return null;

  let decoded: unknown;
  try {
    decoded = JSON.parse(first.message.content);
  } catch {
    return null;
  }
  if (
    !isRecord(decoded) ||
    Object.keys(decoded).sort().join(",") !==
      "areaId,intent,language,reportKind"
  ) {
    return null;
  }
  return validateClassification(decoded, request);
}

function guidanceBody(
  model: string,
  request: AssistantRequest,
  classification: AssistantClassification,
) {
  const area = request.areas.find((item) => item.id === classification.areaId)!;
  const forecast =
    request.forecast?.areaId === classification.areaId ? request.forecast : null;

  return {
    model,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      {
        role: "system",
        content: [
          "You are the Batti Assistant. Give concise household power Guidance.",
          ASSISTANT_SAFETY,
          `Trusted Area context: ${JSON.stringify({ area, forecast })}`,
          classification.intent === "report"
            ? "Acknowledge the proposed Report without saying it was submitted."
            : "Answer using the trusted context and its evidence labels.",
        ].join("\n\n"),
      },
      {
        role: "user",
        content: JSON.stringify({
          history: request.history.map(({ role, content }) => ({ role, content })),
          message: request.message,
          language: classification.language,
        }),
      },
    ],
  };
}

function streamGuidance(
  body: ReadableStream<Uint8Array>,
  classification: AssistantClassification,
): Response {
  const output = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      const processFrame = (frame: string) => {
        const data = frame
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!data) throw new Error("malformed_sse");
        if (data === "[DONE]") {
          finished = true;
          return;
        }

        const payload: unknown = JSON.parse(data);
        if (!isRecord(payload) || !Array.isArray(payload.choices)) {
          throw new Error("malformed_sse");
        }
        if (payload.choices.length === 0 && isRecord(payload.usage)) return;

        const first = payload.choices[0];
        if (!isRecord(first) || !isRecord(first.delta)) {
          throw new Error("malformed_sse");
        }
        const content = first.delta.content;
        if (content === undefined || content === null) return;
        if (typeof content !== "string") throw new Error("malformed_sse");
        controller.enqueue(encodeEvent({ type: "delta", text: content }));
      };

      try {
        while (!finished) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });

          let separator = buffer.search(/\r?\n\r?\n/);
          while (separator !== -1) {
            const frame = buffer.slice(0, separator);
            const delimiter = buffer.slice(separator).match(/^\r?\n\r?\n/)![0];
            buffer = buffer.slice(separator + delimiter.length);
            if (frame.trim()) processFrame(frame);
            if (finished) break;
            separator = buffer.search(/\r?\n\r?\n/);
          }

          if (done) {
            buffer += decoder.decode();
            if (buffer.trim()) processFrame(buffer);
            if (!finished) throw new Error("incomplete_sse");
            break;
          }
        }

        if (classification.intent === "report") {
          controller.enqueue(
            encodeEvent({
              type: "report_draft",
              areaId: classification.areaId,
              kind: classification.reportKind!,
            }),
          );
        }
        controller.enqueue(encodeEvent({ type: "done" }));
      } catch {
        controller.enqueue(encodeEvent({ type: "error", code: "stream_failed" }));
        controller.enqueue(encodeEvent({ type: "done" }));
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(output, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function readRequest(request: Request): Promise<AssistantRequest | null> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return null;

  const text = await request.text();
  if (!text || new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return null;
  }
  try {
    return validateAssistantRequest(JSON.parse(text));
  } catch {
    return null;
  }
}

export function createAssistantHandler(
  requestFetch: typeof fetch,
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method !== "POST") {
      return jsonError({ type: "error", code: "invalid_request" }, 405);
    }
    if (
      request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !==
      "application/json"
    ) {
      return jsonError({ type: "error", code: "invalid_request" }, 415);
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return jsonError({ type: "error", code: "provider_failed" }, 500);
    }

    const parsed = await readRequest(request);
    if (!parsed) {
      return jsonError({ type: "error", code: "invalid_request" }, 400);
    }

    const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
    let classifierResponse: Response;
    try {
      classifierResponse = await requestFetch(
        OPENROUTER_URL,
        providerRequest(apiKey, classifierBody(model, parsed)),
      );
    } catch {
      return jsonError({ type: "error", code: "provider_failed" }, 502);
    }
    if (!classifierResponse.ok) {
      return jsonError({ type: "error", code: "provider_failed" }, 502);
    }

    let classification: AssistantClassification | null = null;
    try {
      classification = parseClassification(await classifierResponse.json(), parsed);
    } catch {
      // Invalid provider payload is a classification failure.
    }
    if (!classification) {
      return jsonError({ type: "error", code: "classification_failed" }, 502);
    }

    if (classification.intent === "off_topic") {
      return eventStream([
        {
          type: "delta",
          text: "I can only help with household power status, safety, and Area Reports.",
        },
        { type: "done" },
      ]);
    }

    let guidanceResponse: Response;
    try {
      guidanceResponse = await requestFetch(
        OPENROUTER_URL,
        providerRequest(apiKey, guidanceBody(model, parsed, classification)),
      );
    } catch {
      return jsonError({ type: "error", code: "provider_failed" }, 502);
    }
    if (!guidanceResponse.ok || !guidanceResponse.body) {
      return jsonError({ type: "error", code: "provider_failed" }, 502);
    }
    return streamGuidance(guidanceResponse.body, classification);
  };
}

export default createAssistantHandler(fetch);
