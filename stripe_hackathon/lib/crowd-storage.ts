import type { Report } from "./types";

const STORAGE_KEY = "batti-crowd-reports-v1";

export function loadCrowdReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isReport);
  } catch {
    return [];
  }
}

export function saveCrowdReports(reports: readonly Report[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function isReport(value: unknown): value is Report {
  if (!value || typeof value !== "object") return false;
  const row = value as Report;
  return (
    typeof row.areaId === "string" &&
    (row.kind === "on" || row.kind === "off" || row.kind === "unsure") &&
    typeof row.at === "string"
  );
}
