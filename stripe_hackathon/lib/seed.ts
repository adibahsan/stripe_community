import { AREAS } from "./areas";
import { curveForMonth } from "./curves";
import { dhakaHour, dhakaMonth } from "./dhaka-time";
import { FUTURE_MS, PAST_MS, SEED_STEP_MINUTES } from "./timeline";
import type { AreaId, Report } from "./types";

export function buildSeed(now: Date): Report[] {
  const reports: Report[] = [];
  const month = dhakaMonth(now);
  const stepMs = SEED_STEP_MINUTES * 60_000;
  AREAS.forEach((area, areaIndex) => {
    const curve = curveForMonth(month, areaIndex);
    for (let offset = -PAST_MS; offset <= FUTURE_MS; offset += stepMs) {
      if (offset === 0) continue;
      const at = new Date(now.getTime() + offset);
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
