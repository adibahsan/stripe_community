import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AREAS } from "../../lib/areas";
import { parseAssistantStream } from "../../lib/assistant-stream";
import type { AssistantEvent, AssistantRequest } from "../../lib/assistant";
import { config, createAssistantHandler } from "./assistant";

const encoder = new TextEncoder();

function validRequest(message = "Dhanmondi te batti ache?"): AssistantRequest {
  return {
    selectedAreaId: "dhanmondi",
    areas: AREAS.map((area) => ({
      id: area.id,
      name: area.name,
      status: area.id === "dhanmondi" ? "off" : "stale",
      eta: { direction: "on", minutes: 42 },
      crowd: {
        on: area.id === "dhanmondi" ? 1 : 0,
        off: area.id === "dhanmondi" ? 3 : 0,
        unsure: 0,
        latestMinutesAgo: area.id === "dhanmondi" ? 4 : null,
      },
    })),
    history: [{ role: "assistant", content: "Which Area?" }],
    message,
    forecast: {
      areaId: "dhanmondi",
      typicalRestoreMinutes: 45,
      sampleHour: 18,
      offCountAtHour: 3,
    },
  };
}

function request(body: unknown = validRequest()): Request {
  return new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function streamedRequest(
  body: ReadableStream<Uint8Array>,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

function openRouterJson(content: string): Response {
  return Response.json({ choices: [{ message: { content } }] });
}

function upstreamStream(fragments: string[]): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const fragment of fragments) {
          controller.enqueue(encoder.encode(fragment));
        }
        controller.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
}

function upstreamByteStream(chunks: Uint8Array[]): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
}

function classification(
  overrides: Partial<{
    intent: "question" | "report" | "off_topic";
    areaId: string;
    reportKind: "on" | "off" | "unsure" | null;
    language: "bn" | "en" | "mixed";
  }> = {},
): Response {
  return openRouterJson(
    JSON.stringify({
      intent: "question",
      areaId: "dhanmondi",
      reportKind: null,
      language: "mixed",
      ...overrides,
    }),
  );
}

async function events(response: Response): Promise<AssistantEvent[]> {
  expect(response.body).not.toBeNull();
  const output: AssistantEvent[] = [];
  for await (const event of parseAssistantStream(response.body!)) {
    output.push(event);
  }
  return output;
}

describe("assistant Netlify Function", () => {
  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-key";
    delete process.env.OPENROUTER_MODEL;
  });

  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_MODEL;
    vi.restoreAllMocks();
  });

  test("classifies a question and streams grounded Guidance", async () => {
    const userText = "Dhanmondi te batti ache?";
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        openRouterJson(
          JSON.stringify({
            intent: "question",
            areaId: "dhanmondi",
            reportKind: null,
            language: "mixed",
          }),
        ),
      )
      .mockResolvedValueOnce(
        upstreamStream([
          'data: {"choices":[{"delta":{"content":"Crowd says "}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"power is off."}}]}\n\n',
          'data: {"choices":[],"usage":{"total_tokens":12}}\n\n',
          "data: [DONE]\n\n",
        ]),
      );

    const response = await createAssistantHandler(requestFetch)(
      request(validRequest(userText)),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(await events(response)).toEqual([
      { type: "delta", text: "Crowd says " },
      { type: "delta", text: "power is off." },
      { type: "done" },
    ]);
    expect(requestFetch).toHaveBeenCalledTimes(2);

    const classifierBody = JSON.parse(
      String((requestFetch.mock.calls[0][1] as RequestInit).body),
    );
    const guidanceBody = JSON.parse(
      String((requestFetch.mock.calls[1][1] as RequestInit).body),
    );

    expect(classifierBody.model).toBe("z-ai/glm-5.3-flash");
    expect(guidanceBody.model).toBe("z-ai/glm-5.3-flash");
    expect(classifierBody.response_format.type).toBe("json_schema");
    expect(classifierBody.response_format.json_schema.schema.additionalProperties).toBe(
      false,
    );
    expect(guidanceBody.stream).toBe(true);

    const classifierSystemText = classifierBody.messages
      .filter((message: { role: string }) => message.role === "system")
      .map((message: { content: string }) => message.content)
      .join("\n");
    for (const area of AREAS) {
      expect(classifierSystemText).toContain(area.id);
      expect(classifierSystemText).toContain(area.name);
    }
    expect(classifierSystemText).toContain(
      "named known Area overrides selected Area",
    );
    expect(classifierSystemText).toContain(
      "otherwise use selectedAreaId",
    );

    const systemText = guidanceBody.messages
      .filter((message: { role: string }) => message.role === "system")
      .map((message: { content: string }) => message.content)
      .join("\n");
    expect(systemText).toContain("Dhanmondi");
    expect(systemText).toContain('"status":"off"');
    expect(systemText).toContain("electrical repair");
    expect(systemText).toContain("Crowd");
    expect(systemText).toContain("Sample pattern");
    expect(systemText).toContain("DESCO");
    expect(systemText).toContain("live-grid");
    expect(systemText).toContain("trained-model");

    for (const body of [classifierBody, guidanceBody]) {
      const systemMessages = body.messages.filter(
        (message: { role: string }) => message.role === "system",
      );
      const userMessages = body.messages.filter(
        (message: { role: string }) => message.role === "user",
      );
      expect(systemMessages.every((message: { content: string }) => !message.content.includes(userText))).toBe(
        true,
      );
      expect(
        userMessages.some((message: { content: string }) =>
          message.content.includes(userText),
        ),
      ).toBe(true);
    }
  });

  test("streams acknowledgement before a Report draft", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        classification({ intent: "report", reportKind: "off" }),
      )
      .mockResolvedValueOnce(
        upstreamStream([
          'data: {"choices":[{"delta":{"content":"Bujhlam."}}]}\n\n',
          "data: [DONE]\n\n",
        ]),
      );

    const response = await createAssistantHandler(requestFetch)(
      request(validRequest("Dhanmondi off")),
    );

    expect(await events(response)).toEqual([
      { type: "delta", text: "Bujhlam." },
      { type: "report_draft", areaId: "dhanmondi", kind: "off" },
      { type: "done" },
    ]);
  });

  test("fails a Report stream that finishes without a non-empty acknowledgement", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        classification({ intent: "report", reportKind: "off" }),
      )
      .mockResolvedValueOnce(
        upstreamStream([
          'data: {"choices":[{"delta":{"content":"   "}}]}\n\n',
          "data: [DONE]\n\n",
        ]),
      );

    const response = await createAssistantHandler(requestFetch)(
      request(validRequest("Dhanmondi off")),
    );

    expect(await events(response)).toEqual([
      { type: "delta", text: "   " },
      { type: "error", code: "stream_failed" },
    ]);
  });

  test("preserves whitespace deltas before a valid Report acknowledgement", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        classification({ intent: "report", reportKind: "off" }),
      )
      .mockResolvedValueOnce(
        upstreamStream([
          'data: {"choices":[{"delta":{"content":"\\n "}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"Bujhlam"}}]}\n\n',
          "data: [DONE]\n\n",
        ]),
      );

    const response = await createAssistantHandler(requestFetch)(
      request(validRequest("Dhanmondi off")),
    );

    expect(await events(response)).toEqual([
      { type: "delta", text: "\n " },
      { type: "delta", text: "Bujhlam" },
      { type: "report_draft", areaId: "dhanmondi", kind: "off" },
      { type: "done" },
    ]);
  });

  test("ignores upstream SSE comment and keepalive frames", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(classification())
      .mockResolvedValueOnce(
        upstreamStream([
          ": OPENROUTER PROCESSING\n\n",
          ": keepalive\n\n",
          'data: {"choices":[{"delta":{"content":"Still here"}}]}\n\n',
          "data: [DONE]\n\n",
        ]),
      );

    const response = await createAssistantHandler(requestFetch)(request());

    expect(await events(response)).toEqual([
      { type: "delta", text: "Still here" },
      { type: "done" },
    ]);
  });

  test("decodes a multibyte UTF-8 delta split across upstream chunks", async () => {
    const bangla = "বিদ্যুৎ";
    const payload =
      `data: ${JSON.stringify({
        choices: [{ delta: { content: bangla } }],
      })}\n\n` + "data: [DONE]\n\n";
    const encoded = encoder.encode(payload);
    const banglaStart = encoder.encode(
      'data: {"choices":[{"delta":{"content":"',
    ).length;
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(classification())
      .mockResolvedValueOnce(
        upstreamByteStream([
          encoded.slice(0, banglaStart + 1),
          encoded.slice(banglaStart + 1),
        ]),
      );

    const response = await createAssistantHandler(requestFetch)(request());

    expect(await events(response)).toEqual([
      { type: "delta", text: bangla },
      { type: "done" },
    ]);
  });

  test("parses fragmented delimiters and combined upstream SSE frames", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(classification())
      .mockResolvedValueOnce(
        upstreamStream([
          'data: {"choices":[{"delta":{"content":"A"}}]}\n',
          '\ndata: {"choices":[{"delta":{"content":"B"}}]}\n\ndata: [DO',
          "NE]\n\n",
        ]),
      );

    const response = await createAssistantHandler(requestFetch)(request());

    expect(await events(response)).toEqual([
      { type: "delta", text: "A" },
      { type: "delta", text: "B" },
      { type: "done" },
    ]);
  });

  test.each([
    [
      "en",
      "I can only help with household power status, safety, and Area Reports.",
    ],
    [
      "bn",
      "আমি শুধু বাসার বিদ্যুৎ অবস্থা, নিরাপত্তা ও এলাকার রিপোর্ট নিয়ে সাহায্য করতে পারি।",
    ],
    [
      "mixed",
      "Ami shudhu household power status, safety, ar Area Report niye help korte pari.",
    ],
  ] as const)(
    "redirects %s off-topic messages without a second provider call",
    async (language, text) => {
      const requestFetch = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          classification({ intent: "off_topic", language }),
        );

      const response = await createAssistantHandler(requestFetch)(
        request(validRequest("Write me a poem")),
      );

      expect(requestFetch).toHaveBeenCalledTimes(1);
      expect(await events(response)).toEqual([
        { type: "delta", text },
        { type: "done" },
      ]);
    },
  );

  test("rejects a missing server API key before calling the provider", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const requestFetch = vi.fn<typeof fetch>();

    const response = await createAssistantHandler(requestFetch)(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "provider_failed" });
    expect(requestFetch).not.toHaveBeenCalled();
  });

  test("rejects non-POST requests", async () => {
    const requestFetch = vi.fn<typeof fetch>();
    const response = await createAssistantHandler(requestFetch)(
      new Request("http://localhost/api/assistant", { method: "GET" }),
    );

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(requestFetch).not.toHaveBeenCalled();
  });

  test("rejects unsupported content types", async () => {
    const requestFetch = vi.fn<typeof fetch>();
    const response = await createAssistantHandler(requestFetch)(
      new Request("http://localhost/api/assistant", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: JSON.stringify(validRequest()),
      }),
    );

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(requestFetch).not.toHaveBeenCalled();
  });

  test("rejects an oversized declared body without reading it", async () => {
    const requestFetch = vi.fn<typeof fetch>();
    const response = await createAssistantHandler(requestFetch)(
      streamedRequest(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            controller.enqueue(encoder.encode("{}"));
            controller.close();
          },
        }),
        { "content-length": String(64 * 1024 + 1) },
      ),
    );

    expect(response.status).toBe(413);
    expect(requestFetch).not.toHaveBeenCalled();
  });

  test("cancels a chunked body as soon as it exceeds the byte cap", async () => {
    const requestFetch = vi.fn<typeof fetch>();
    const cancel = vi.fn();
    let pulls = 0;
    const chunk = new Uint8Array(16 * 1024);
    const response = await createAssistantHandler(requestFetch)(
      streamedRequest(
        new ReadableStream<Uint8Array>({
          pull(controller) {
            pulls += 1;
            if (pulls <= 8) {
              controller.enqueue(chunk);
            } else {
              controller.close();
            }
          },
          cancel,
        }),
      ),
    );

    expect(response.status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(pulls).toBeLessThan(10);
    expect(requestFetch).not.toHaveBeenCalled();
  });

  test("rejects a missing request body", async () => {
    const requestFetch = vi.fn<typeof fetch>();
    const emptyRequest = new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
    });

    const response = await createAssistantHandler(requestFetch)(emptyRequest);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(requestFetch).not.toHaveBeenCalled();
  });

  test("rejects malformed request JSON", async () => {
    const requestFetch = vi.fn<typeof fetch>();
    const malformedRequest = new Request("http://localhost/api/assistant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });

    const response = await createAssistantHandler(requestFetch)(malformedRequest);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
    expect(requestFetch).not.toHaveBeenCalled();
  });

  test("rejects malformed classifier output without creating a Report draft", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(openRouterJson("not-json"));

    const response = await createAssistantHandler(requestFetch)(request());

    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("report_draft");
  });

  test("rejects a classifier's unknown Area without creating a Report draft", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(classification({ areaId: "unknown" }));

    const response = await createAssistantHandler(requestFetch)(request());

    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("report_draft");
  });

  test("rejects a Report classification without a Report kind", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        classification({ intent: "report", reportKind: null }),
      );

    const response = await createAssistantHandler(requestFetch)(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "classification_failed" });
    expect(requestFetch).toHaveBeenCalledTimes(1);
  });

  test("rejects a question classification with a Report kind", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        classification({ intent: "question", reportKind: "off" }),
      );

    const response = await createAssistantHandler(requestFetch)(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "classification_failed" });
    expect(requestFetch).toHaveBeenCalledTimes(1);
  });

  test("returns provider failure for a non-2xx classifier response", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }));

    const response = await createAssistantHandler(requestFetch)(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "provider_failed" });
    expect(requestFetch).toHaveBeenCalledTimes(1);
  });

  test("returns provider failure when the streaming response has no body", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(classification())
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const response = await createAssistantHandler(requestFetch)(request());

    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("report_draft");
  });

  test("returns provider failure for a non-2xx second-stage response", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(classification())
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }));

    const response = await createAssistantHandler(requestFetch)(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "provider_failed" });
    expect(requestFetch).toHaveBeenCalledTimes(2);
  });

  test("emits stream failure for malformed upstream SSE and no Report draft", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        classification({ intent: "report", reportKind: "off" }),
      )
      .mockResolvedValueOnce(
        upstreamStream(["data: {not-json}\n\n", "data: [DONE]\n\n"]),
      );

    const response = await createAssistantHandler(requestFetch)(
      request(validRequest("Dhanmondi off")),
    );
    const output = await events(response);

    expect(output).toEqual([{ type: "error", code: "stream_failed" }]);
    expect(output.some((event) => event.type === "report_draft")).toBe(false);
  });

  test("emits stream failure after a mid-stream provider error and no Report draft", async () => {
    let pullCount = 0;
    const brokenBody = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (pullCount++ === 0) {
          controller.enqueue(
            encoder.encode(
              'data: {"choices":[{"delta":{"content":"Bujhlam"}}]}\n\n',
            ),
          );
        } else {
          controller.error(new Error("connection reset"));
        }
      },
    });
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        classification({ intent: "report", reportKind: "off" }),
      )
      .mockResolvedValueOnce(new Response(brokenBody));

    const response = await createAssistantHandler(requestFetch)(
      request(validRequest("Dhanmondi off")),
    );
    const output = await events(response);

    expect(output).toEqual([
      { type: "delta", text: "Bujhlam" },
      { type: "error", code: "stream_failed" },
    ]);
    expect(output.some((event) => event.type === "report_draft")).toBe(false);
  });

  test("exports the exact Netlify route and rate limit", () => {
    expect(config).toEqual({
      path: "/api/assistant",
      rateLimit: {
        windowLimit: 30,
        windowSize: 60,
        aggregateBy: ["ip", "domain"],
      },
    });
  });
});
