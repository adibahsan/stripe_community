import type { Report, Status } from "./types";

const WINDOW_MS = 30 * 60_000;

export function statusForArea(
  reports: readonly Report[],
  at: Date,
  areaId: Report["areaId"] = "dhanmondi",
): Status {
  const cutoff = at.getTime() - WINDOW_MS;
  const atMs = at.getTime();
  const inWindow = reports.filter((report) => {
    const t = Date.parse(report.at);
    return report.areaId === areaId && t >= cutoff && t <= atMs;
  });

  const votes = inWindow.filter((report) => report.kind !== "unsure");
  if (votes.length === 0) return "stale";

  const onCount = votes.filter((report) => report.kind === "on").length;
  const offCount = votes.filter((report) => report.kind === "off").length;
  if (onCount > offCount) return "on";
  if (offCount > onCount) return "off";

  const latest = [...votes].sort(
    (a, b) => Date.parse(b.at) - Date.parse(a.at),
  )[0];
  return latest.kind === "on" ? "on" : "off";
}
