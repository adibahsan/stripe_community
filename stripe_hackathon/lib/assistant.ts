import { AREAS } from "./areas";
import type { AreaId, Eta, Forecast, Report, ReportKind, Status } from "./types";

const WINDOW_MS = 30 * 60_000;
const AREA_IDS = new Set<AreaId>(AREAS.map((area) => area.id));
const AREA_NAMES = new Map<AreaId, string>(AREAS.map((area) => [area.id, area.name]));

export type CrowdEvidence = {
  on: number;
  off: number;
  unsure: number;
  latestMinutesAgo: number | null;
};

export type AssistantArea = {
  id: AreaId;
  name: string;
  status: Status;
  eta: Eta;
  crowd: CrowdEvidence;
};

export type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantForecast = Forecast & {
  areaId: AreaId;
};

export type AssistantRequest = {
  selectedAreaId: AreaId;
  areas: AssistantArea[];
  history: AssistantMessage[];
  message: string;
  forecast: AssistantForecast | null;
};

export type AssistantClassification = {
  intent: "question" | "report" | "off_topic";
  areaId: AreaId;
  reportKind: ReportKind | null;
  language: "bn" | "en" | "mixed";
};

export type AssistantEvent =
  | { type: "delta"; text: string }
  | { type: "report_draft"; areaId: AreaId; kind: ReportKind }
  | { type: "done" }
  | {
      type: "error";
      code:
        | "invalid_request"
        | "classification_failed"
        | "provider_failed"
        | "stream_failed";
    };

export const ASSISTANT_SESSION_LIMIT = 20;

export type AssistantReplyState = {
  content: string;
  reportDraft: { areaId: AreaId; kind: ReportKind } | null;
  status: "streaming" | "done" | "error";
  errorCode: Extract<AssistantEvent, { type: "error" }>["code"] | null;
};

export function canSubmitAssistantMessage(submittedCount: number): boolean {
  return submittedCount < ASSISTANT_SESSION_LIMIT;
}

export function appendAssistantEvent(
  state: AssistantReplyState,
  event: AssistantEvent,
): AssistantReplyState {
  if (state.status !== "streaming") return state;

  switch (event.type) {
    case "delta":
      return { ...state, content: state.content + event.text };
    case "report_draft":
      return {
        ...state,
        reportDraft: { areaId: event.areaId, kind: event.kind },
      };
    case "done":
      return { ...state, status: "done" };
    case "error":
      return { ...state, status: "error", errorCode: event.code };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isAreaId(value: unknown): value is AreaId {
  return typeof value === "string" && AREA_IDS.has(value as AreaId);
}

function isStatus(value: unknown): value is Status {
  return value === "on" || value === "off" || value === "stale";
}

function isEta(value: unknown): value is Eta {
  if (!isRecord(value)) return false;
  if (value.direction !== "on" && value.direction !== "off") return false;
  return typeof value.minutes === "number" && Number.isFinite(value.minutes);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function isReportKind(value: unknown): value is ReportKind {
  return value === "on" || value === "off" || value === "unsure";
}

function isCrowdEvidence(value: unknown): value is CrowdEvidence {
  if (!isRecord(value)) return false;
  if (!isNonNegativeInteger(value.on)) return false;
  if (!isNonNegativeInteger(value.off)) return false;
  if (!isNonNegativeInteger(value.unsure)) return false;
  if (value.latestMinutesAgo !== null && !isNonNegativeInteger(value.latestMinutesAgo)) {
    return false;
  }
  return true;
}

function crowdEvidenceForArea(
  crowd: readonly Report[],
  areaId: AreaId,
  now: Date,
): CrowdEvidence {
  const cutoff = now.getTime() - WINDOW_MS;
  const inWindow = crowd.filter(
    (report) => report.areaId === areaId && Date.parse(report.at) >= cutoff,
  );

  let latestMinutesAgo: number | null = null;
  if (inWindow.length > 0) {
    const latestAt = Math.max(...inWindow.map((report) => Date.parse(report.at)));
    latestMinutesAgo = Math.max(
      0,
      Math.floor((now.getTime() - latestAt) / 60_000),
    );
  }

  return {
    on: inWindow.filter((report) => report.kind === "on").length,
    off: inWindow.filter((report) => report.kind === "off").length,
    unsure: inWindow.filter((report) => report.kind === "unsure").length,
    latestMinutesAgo,
  };
}

export function buildAssistantAreas(input: {
  now: Date;
  crowd: readonly Report[];
  statusByArea: Readonly<Record<string, Status>>;
  etaByArea: Readonly<Record<string, Eta>>;
}): AssistantArea[] {
  const { now, crowd, statusByArea, etaByArea } = input;

  return AREAS.map((area) => ({
    id: area.id,
    name: area.name,
    status: statusByArea[area.id] ?? "stale",
    eta: etaByArea[area.id] ?? { direction: "on", minutes: 0 },
    crowd: crowdEvidenceForArea(crowd, area.id, now),
  }));
}

function validateAreas(value: unknown): AssistantArea[] | null {
  if (!Array.isArray(value) || value.length !== AREAS.length) return null;

  const areas: AssistantArea[] = [];
  const seen = new Set<AreaId>();

  for (const item of value) {
    if (!isRecord(item)) return null;
    if (!isAreaId(item.id)) return null;
    if (seen.has(item.id)) return null;
    seen.add(item.id);
    if (typeof item.name !== "string") return null;
    if (item.name !== AREA_NAMES.get(item.id)) return null;
    if (!isStatus(item.status)) return null;
    if (!isEta(item.eta)) return null;
    if (!isCrowdEvidence(item.crowd)) return null;

    areas.push({
      id: item.id,
      name: item.name,
      status: item.status,
      eta: item.eta,
      crowd: item.crowd,
    });
  }

  if (!AREAS.every((area) => seen.has(area.id))) return null;
  return areas;
}

function validateHistory(value: unknown): AssistantMessage[] | null {
  if (!Array.isArray(value) || value.length > 6) return null;

  const history: AssistantMessage[] = [];
  for (const item of value) {
    if (!isRecord(item)) return null;
    if (item.role !== "user" && item.role !== "assistant") return null;
    if (typeof item.content !== "string") return null;
    const content = item.content.trim();
    if (content.length < 1 || content.length > 1000) return null;
    history.push({ role: item.role, content });
  }

  return history;
}

function validateForecast(value: unknown): AssistantForecast | null {
  if (value === null) return null;
  if (!isRecord(value)) return null;
  if (!isAreaId(value.areaId)) return null;
  if (
    typeof value.typicalRestoreMinutes !== "number" ||
    !Number.isFinite(value.typicalRestoreMinutes)
  ) {
    return null;
  }
  if (typeof value.sampleHour !== "number" || !Number.isFinite(value.sampleHour)) {
    return null;
  }
  if (
    typeof value.offCountAtHour !== "number" ||
    !Number.isFinite(value.offCountAtHour)
  ) {
    return null;
  }

  return {
    areaId: value.areaId,
    typicalRestoreMinutes: value.typicalRestoreMinutes,
    sampleHour: value.sampleHour,
    offCountAtHour: value.offCountAtHour,
  };
}

export function validateAssistantRequest(value: unknown): AssistantRequest | null {
  if (!isRecord(value)) return null;
  if (!isAreaId(value.selectedAreaId)) return null;

  const areas = validateAreas(value.areas);
  if (!areas) return null;
  if (!areas.some((area) => area.id === value.selectedAreaId)) return null;

  const history = validateHistory(value.history);
  if (!history) return null;

  if (typeof value.message !== "string") return null;
  const message = value.message.trim();
  if (message.length < 1 || message.length > 1000) return null;

  const forecast = validateForecast(value.forecast);
  if (value.forecast !== null && forecast === null) return null;

  return {
    selectedAreaId: value.selectedAreaId,
    areas,
    history,
    message,
    forecast,
  };
}

export function validateClassification(
  value: unknown,
  request: AssistantRequest,
): AssistantClassification | null {
  if (!isRecord(value)) return null;

  const intent = value.intent;
  if (intent !== "question" && intent !== "report" && intent !== "off_topic") {
    return null;
  }

  if (!isAreaId(value.areaId)) return null;
  if (!request.areas.some((area) => area.id === value.areaId)) return null;

  const language = value.language;
  if (language !== "bn" && language !== "en" && language !== "mixed") {
    return null;
  }

  const reportKind = value.reportKind;
  if (intent === "report") {
    if (!isReportKind(reportKind)) return null;
  } else if (reportKind !== null) {
    return null;
  }

  return {
    intent,
    areaId: value.areaId,
    reportKind: intent === "report" ? reportKind : null,
    language,
  };
}
