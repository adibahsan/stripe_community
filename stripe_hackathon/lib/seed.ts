import { AREAS } from "./areas";
import { curveForMonth } from "./curves";
import { dhakaHour, dhakaMonth } from "./dhaka-time";
import type { AreaId, Report } from "./types";

export function buildSeed(now: Date): Report[] {
  const reports: Report[] = [];
  const month = dhakaMonth(now);
  AREAS.forEach((area, areaIndex) => {
    const curve = curveForMonth(month, areaIndex);
    for (let minutesAgo = 35; minutesAgo <= 360; minutesAgo += 20) {
      const at = new Date(now.getTime() - minutesAgo * 60_000);
      reports.push({
        areaId: area.id,
        kind: curve[dhakaHour(at)] ?? "on",
        at: at.toISOString(),
      });
    }
    reports.push({
      areaId: area.id,
      kind: curve[dhakaHour(now)] ?? "on",
      at: new Date(now.getTime() - 5 * 60_000).toISOString(),
    });
  });
  return reports;
}

export function seedForArea(seed: readonly Report[], areaId: AreaId): Report[] {
  return seed.filter((report) => report.areaId === areaId);
}
