import type { AssistantEvent } from "./assistant";
import { isAreaId, isRecord, isReportKind } from "./assistant";

const ERROR_CODES = new Set([
  "invalid_request",
  "classification_failed",
  "provider_failed",
  "stream_failed",
]);

function invalidStream(): never {
  throw new Error("invalid_assistant_stream");
}

function isEmptyObject(value: unknown): value is Record<string, never> {
  return isRecord(value) && Object.keys(value).length === 0;
}

function parseFrame(frame: string): AssistantEvent {
  let eventType: string | null = null;
  const dataLines: string[] = [];

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      eventType = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (!eventType || dataLines.length === 0) {
    invalidStream();
  }

  let data: unknown;
  try {
    data = JSON.parse(dataLines.join("\n"));
  } catch {
    invalidStream();
  }

  switch (eventType) {
    case "delta": {
      if (!isRecord(data) || typeof data.text !== "string") {
        invalidStream();
      }
      return { type: "delta", text: data.text };
    }
    case "report_draft": {
      if (!isRecord(data)) invalidStream();
      if (!isAreaId(data.areaId) || !isReportKind(data.kind)) {
        invalidStream();
      }
      return { type: "report_draft", areaId: data.areaId, kind: data.kind };
    }
    case "done": {
      if (!isEmptyObject(data)) invalidStream();
      return { type: "done" };
    }
    case "error": {
      if (
        !isRecord(data) ||
        typeof data.code !== "string" ||
        !ERROR_CODES.has(data.code)
      ) {
        invalidStream();
      }
      return {
        type: "error",
        code: data.code as Extract<AssistantEvent, { type: "error" }>["code"],
      };
    }
    default:
      invalidStream();
  }
}

export async function* parseAssistantStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<AssistantEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      let separatorIndex = buffer.indexOf("\n\n");
      while (separatorIndex !== -1) {
        const frame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        if (frame.length > 0) {
          yield parseFrame(frame);
        }
        separatorIndex = buffer.indexOf("\n\n");
      }

      if (done) {
        buffer += decoder.decode();
        const remaining = buffer.trim();
        if (remaining.length > 0) {
          yield parseFrame(remaining);
        }
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
