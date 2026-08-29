import { describe, expect, test } from "vitest";
import { AREAS } from "./areas";
import { curveForMonth } from "./curves";
import { dhakaHour, dhakaMonth } from "./dhaka-time";
import { buildSeed } from "./seed";
import { statusForArea } from "./status";
import { FUTURE_MS, PAST_MS } from "./timeline";

const now = new Date("2026-08-29T12:00:00.000Z");
const WINDOW_MS = 30 * 60_000;

function latestLive(seed: ReturnType<typeof buildSeed>, areaId: string) {
  return seed
    .filter((report) => {
      const t = Date.parse(report.at);
      return (
        report.areaId === areaId &&
        t >= now.getTime() - WINDOW_MS &&
        t <= now.getTime()
      );
    })
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
}

describe("buildSeed", () => {
  test("Seed plants a live Report in the last 30 minutes matching this month's curve", () => {
    const seed = buildSeed(now);
    const live = latestLive(seed, "dhanmondi");
    expect(live).toBeDefined();
    const curve = curveForMonth(dhakaMonth(now), 0);
    expect(live?.kind).toBe(curve[dhakaHour(now)]);
  });

  test("oldest seed timestamp is at least 7 days before now", () => {
    const seed = buildSeed(now);
    const oldest = Math.min(...seed.map((report) => Date.parse(report.at)));
    expect(now.getTime() - oldest).toBeGreaterThanOrEqual(PAST_MS);
  });

  test("newest seed timestamp is at least 3 days after now", () => {
    const seed = buildSeed(now);
    const newest = Math.max(...seed.map((report) => Date.parse(report.at)));
    expect(newest - now.getTime()).toBeGreaterThanOrEqual(FUTURE_MS);
  });

  test("statusForArea at now is not stale because future reports are excluded", () => {
    const seed = buildSeed(now);
    expect(statusForArea(seed, now, "dhanmondi")).not.toBe("stale");
  });

  test("times about 2 days ago and 2 days ahead are on or off for dhanmondi", () => {
    const seed = buildSeed(now);
    const twoDays = 2 * 24 * 60 * 60_000;
    expect(
      statusForArea(seed, new Date(now.getTime() - twoDays), "dhanmondi"),
    ).not.toBe("stale");
    expect(
      statusForArea(seed, new Date(now.getTime() + twoDays), "dhanmondi"),
    ).not.toBe("stale");
  });

  test("each Area follows its own shifted month curve", () => {
    const seed = buildSeed(now);
    const gulshan = AREAS.findIndex((area) => area.id === "gulshan");
    const live = latestLive(seed, "gulshan");
    const curve = curveForMonth(dhakaMonth(now), gulshan);
    expect(live?.kind).toBe(curve[dhakaHour(now)]);
  });
});
