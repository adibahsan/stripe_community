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

  test("redirects off-topic messages without a second provider call", async () => {
    const requestFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(classification({ intent: "off_topic" }));

    const response = await createAssistantHandler(requestFetch)(
      request(validRequest("Write me a poem")),
    );
    const output = await events(response);

    expect(requestFetch).toHaveBeenCalledTimes(1);
    expect(output).toHaveLength(2);
    expect(output[0]).toMatchObject({ type: "delta" });
    expect((output[0] as Extract<AssistantEvent, { type: "delta" }>).text).toContain(
      "power",
    );
    expect(output[1]).toEqual({ type: "done" });
  });

  test("rejects a missing server API key before calling the provider", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const requestFetch = vi.fn<typeof fetch>();

    const response = await createAssistantHandler(requestFetch)(request());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "provider_failed" });
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

    expect(output).toEqual([
      { type: "error", code: "stream_failed" },
      { type: "done" },
    ]);
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
      { type: "done" },
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
