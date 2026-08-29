import { AREAS } from "./areas";
import { dhakaHour } from "./dhaka-time";
import type { AreaId, Report } from "./types";

/** Evening-peak-ish pattern: more Off around 18:00–22:00 local-shaped hours. */
function patternAt(hour: number, areaIndex: number): Report["kind"] {
  const peak = hour >= 17 && hour <= 22;
  const ripple = (hour + areaIndex) % 3;
  if (peak && ripple !== 0) return "off";
  if (!peak && ripple === 2) return "off";
  return "on";
}

export function buildSeed(now: Date): Report[] {
  const reports: Report[] = [];
  AREAS.forEach((area, areaIndex) => {
    for (let minutesAgo = 35; minutesAgo <= 360; minutesAgo += 20) {
      const at = new Date(now.getTime() - minutesAgo * 60_000);
      reports.push({
        areaId: area.id,
        kind: patternAt(dhakaHour(at), areaIndex),
        at: at.toISOString(),
      });
    }
  });
  return reports;
}

export function seedForArea(seed: readonly Report[], areaId: AreaId): Report[] {
  return seed.filter((report) => report.areaId === areaId);
}
