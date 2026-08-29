import { AREAS } from "./areas";
import type { AssistantEvent } from "./assistant";
import type { AreaId, ReportKind } from "./types";

const AREA_IDS = new Set<AreaId>(AREAS.map((area) => area.id));

const ERROR_CODES = new Set([
  "invalid_request",
  "classification_failed",
  "provider_failed",
  "stream_failed",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAreaId(value: unknown): value is AreaId {
  return typeof value === "string" && AREA_IDS.has(value as AreaId);
}

function isReportKind(value: unknown): value is ReportKind {
  return value === "on" || value === "off" || value === "unsure";
}

function invalidStream(): never {
  throw new Error("invalid_assistant_stream");
}

function parseFrame(frame: string): AssistantEvent {
  let eventType: string | null = null;
  let dataLine: string | null = null;

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      eventType = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLine = line.slice("data:".length).trim();
    }
  }

  if (!eventType || dataLine === null) {
    invalidStream();
  }

  let data: unknown;
  try {
    data = JSON.parse(dataLine);
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
      if (!isRecord(data)) invalidStream();
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
