import { dhakaHour } from "./dhaka-time";
import type { AreaId, Forecast, Report } from "./types";

export function forecastForArea(
  seed: readonly Report[],
  areaId: AreaId,
  at: Date,
): Forecast {
  const sampleHour = dhakaHour(at);
  const inArea = seed
    .filter((report) => report.areaId === areaId)
    .slice()
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  const gaps: number[] = [];
  let lastOff: number | null = null;
  for (const report of inArea) {
    const time = Date.parse(report.at);
    if (report.kind === "off") lastOff = time;
    if (report.kind === "on" && lastOff !== null) {
      gaps.push((time - lastOff) / 60_000);
      lastOff = null;
    }
  }

  const typicalRestoreMinutes =
    gaps.length === 0
      ? 45
      : Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length);

  const offCountAtHour = inArea.filter(
    (report) =>
      report.kind === "off" &&
      dhakaHour(new Date(report.at)) === sampleHour,
  ).length;

  return { typicalRestoreMinutes, sampleHour, offCountAtHour };
}
