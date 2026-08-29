import { describe, expect, test } from "vitest";
import { AREAS } from "@/lib/areas";
import { createAssistantHandler } from "@/lib/assistant-server";
import { parseAssistantStream } from "@/lib/assistant-stream";
import type { AssistantArea, AssistantRequest } from "@/lib/assistant";

const apiKey = process.env.OPENROUTER_API_KEY;

function buildAreas(): AssistantArea[] {
  return AREAS.map((area) => ({
    id: area.id,
    name: area.name,
    status: "stale" as const,
    eta: { direction: "on" as const, minutes: 45 },
    crowd: { on: 0, off: 0, unsure: 0, latestMinutesAgo: null },
  }));
}

function buildRequest(message: string): AssistantRequest {
  return {
    selectedAreaId: "dhanmondi",
    areas: buildAreas(),
    history: [],
    message,
    forecast: null,
  };
}

async function collectEvents(body: ReadableStream<Uint8Array>) {
  const events = [];
  for await (const event of parseAssistantStream(body)) {
    events.push(event);
  }
  return events;
}

describe.skipIf(!apiKey)("live OpenRouter Assistant", () => {
  test("classifies a Banglish Off Report for Dhanmondi", async () => {
    const handler = createAssistantHandler(fetch);
    const response = await handler(
      new Request("http://localhost/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildRequest("Current chole gese")),
      }),
    );

    expect(response.ok).toBe(true);
    expect(response.body).not.toBeNull();
    const events = await collectEvents(response.body!);
    expect(events.some((event) => event.type === "delta")).toBe(true);
    expect(
      events.some(
        (event) =>
          event.type === "report_draft" &&
          event.areaId === "dhanmondi" &&
          event.kind === "off",
      ),
    ).toBe(true);
    expect(events.at(-1)?.type).toBe("done");
  }, 60_000);

  test("streams grounded English Guidance with Sample pattern wording", async () => {
    const handler = createAssistantHandler(fetch);
    const response = await handler(
      new Request("http://localhost/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          buildRequest("What is the power status in Dhanmondi right now?"),
        ),
      }),
    );

    expect(response.ok).toBe(true);
    const events = await collectEvents(response.body!);
    const text = events
      .filter((event) => event.type === "delta")
      .map((event) => (event.type === "delta" ? event.text : ""))
      .join("");
    expect(text.length).toBeGreaterThan(20);
    expect(/sample pattern|crowd/i.test(text)).toBe(true);
    expect(events.some((event) => event.type === "report_draft")).toBe(false);
  }, 60_000);

  test("redirects off-topic chat without inventing utility access", async () => {
    const handler = createAssistantHandler(fetch);
    const response = await handler(
      new Request("http://localhost/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildRequest("Write me a poem about cricket")),
      }),
    );

    expect(response.ok).toBe(true);
    const events = await collectEvents(response.body!);
    const text = events
      .filter((event) => event.type === "delta")
      .map((event) => (event.type === "delta" ? event.text : ""))
      .join("")
      .toLowerCase();
    expect(text).toMatch(/power|report|area|status|বিদ্যুৎ|রিপোর্ট/);
    expect(events.some((event) => event.type === "report_draft")).toBe(false);
  }, 60_000);
});

if (!apiKey) {
  test("live Assistant suite requires OPENROUTER_API_KEY", () => {
    throw new Error(
      "Set OPENROUTER_API_KEY in the environment, then run pnpm test:assistant:live",
    );
  });
}
