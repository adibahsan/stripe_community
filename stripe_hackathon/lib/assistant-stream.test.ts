import { describe, expect, test } from "vitest";
import type { AssistantEvent } from "./assistant";
import { parseAssistantStream } from "./assistant-stream";

async function collectEvents(
  body: ReadableStream<Uint8Array>,
): Promise<AssistantEvent[]> {
  const events: AssistantEvent[] = [];
  for await (const event of parseAssistantStream(body)) {
    events.push(event);
  }
  return events;
}

function streamFromFragments(fragments: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const fragment of fragments) {
        controller.enqueue(encoder.encode(fragment));
      }
      controller.close();
    },
  });
}

function streamFromByteChunks(chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
}

describe("parseAssistantStream", () => {
  test("parses frames split across UTF-8 and SSE delimiter boundaries", async () => {
    const frames = [
      'event: delta\ndata: {"text":"Bujh',
      'lam"}\n\nevent: report_draft\ndata: {"areaId":"dhanmondi",',
      '"kind":"off"}\n\nevent: done\ndata: {}\n\n',
    ];

    const events = await collectEvents(streamFromFragments(frames));

    expect(events).toEqual([
      { type: "delta", text: "Bujhlam" },
      { type: "report_draft", areaId: "dhanmondi", kind: "off" },
      { type: "done" },
    ]);
  });

  test("decodes Bangla text split across multibyte UTF-8 boundaries", async () => {
    const bangla = "বিদ্যুৎ";
    const payload = `event: delta\ndata: {"text":"${bangla}"}\n\n`;
    const encoded = new TextEncoder().encode(payload);
    const banglaStart = new TextEncoder().encode(
      `event: delta\ndata: {"text":"`,
    ).length;
    const splitAt = banglaStart + 1;

    const events = await collectEvents(
      streamFromByteChunks([
        encoded.slice(0, splitAt),
        encoded.slice(splitAt),
      ]),
    );

    expect(events).toEqual([{ type: "delta", text: bangla }]);
  });

  test("parses multiple frames delivered in one transport chunk", async () => {
    const chunk =
      'event: delta\ndata: {"text":"a"}\n\n' +
      'event: delta\ndata: {"text":"b"}\n\n' +
      'event: done\ndata: {}\n\n';

    const events = await collectEvents(streamFromFragments([chunk]));

    expect(events).toEqual([
      { type: "delta", text: "a" },
      { type: "delta", text: "b" },
      { type: "done" },
    ]);
  });

  test("parses a final frame without trailing blank line at EOF", async () => {
    const chunk =
      'event: delta\ndata: {"text":"hi"}\n\n' +
      'event: done\ndata: {}';

    const events = await collectEvents(streamFromFragments([chunk]));

    expect(events).toEqual([
      { type: "delta", text: "hi" },
      { type: "done" },
    ]);
  });

  test("throws invalid_assistant_stream for malformed JSON", async () => {
    const chunk = 'event: delta\ndata: {not-json}\n\n';

    await expect(collectEvents(streamFromFragments([chunk]))).rejects.toThrow(
      "invalid_assistant_stream",
    );
  });

  test("throws invalid_assistant_stream for unknown event types", async () => {
    const chunk = 'event: mystery\ndata: {"foo":"bar"}\n\n';

    await expect(collectEvents(streamFromFragments([chunk]))).rejects.toThrow(
      "invalid_assistant_stream",
    );
  });

  test("parses error events with known codes", async () => {
    const chunk =
      'event: error\ndata: {"code":"provider_failed"}\n\n' +
      'event: done\ndata: {}\n\n';

    const events = await collectEvents(streamFromFragments([chunk]));

    expect(events).toEqual([
      { type: "error", code: "provider_failed" },
      { type: "done" },
    ]);
  });

  test("throws invalid_assistant_stream for invalid report_draft areaId", async () => {
    const chunk =
      'event: report_draft\ndata: {"areaId":"unknown","kind":"off"}\n\n';

    await expect(collectEvents(streamFromFragments([chunk]))).rejects.toThrow(
      "invalid_assistant_stream",
    );
  });

  test("throws invalid_assistant_stream for invalid report_draft kind", async () => {
    const chunk =
      'event: report_draft\ndata: {"areaId":"dhanmondi","kind":"maybe"}\n\n';

    await expect(collectEvents(streamFromFragments([chunk]))).rejects.toThrow(
      "invalid_assistant_stream",
    );
  });
});
