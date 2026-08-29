import { describe, expect, test } from "vitest";
import { AREAS } from "./areas";
import { curveForMonth } from "./curves";
import { dhakaHour, dhakaMonth } from "./dhaka-time";
import { buildSeed } from "./seed";

const now = new Date("2026-08-29T12:00:00.000Z");

describe("buildSeed", () => {
  test("Seed plants a live Report in the last 30 minutes matching this month's curve", () => {
    const seed = buildSeed(now);
    const live = seed.filter(
      (report) =>
        report.areaId === "dhanmondi" &&
        Date.parse(report.at) >= now.getTime() - 30 * 60_000,
    );
    expect(live.length).toBeGreaterThan(0);
    const curve = curveForMonth(dhakaMonth(now), 0);
    expect(live[0]?.kind).toBe(curve[dhakaHour(now)]);
  });

  test("Seed still covers about six hours so the hour strip is not empty", () => {
    const seed = buildSeed(now);
    const oldest = Math.min(...seed.map((report) => Date.parse(report.at)));
    expect(now.getTime() - oldest).toBeGreaterThanOrEqual(5 * 60 * 60_000);
  });

  test("each Area follows its own shifted month curve", () => {
    const seed = buildSeed(now);
    const gulshan = AREAS.findIndex((area) => area.id === "gulshan");
    const live = seed.find(
      (report) =>
        report.areaId === "gulshan" &&
        Date.parse(report.at) >= now.getTime() - 30 * 60_000,
    );
    const curve = curveForMonth(dhakaMonth(now), gulshan);
    expect(live?.kind).toBe(curve[dhakaHour(now)]);
  });
});
