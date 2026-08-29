import { describe, expect, test } from "vitest";
import { forecastForArea } from "./forecast";
import type { Report } from "./types";

const now = new Date("2026-08-29T18:00:00.000Z");

function offThenOn(minutesAgoOff: number, minutesAgoOn: number): Report[] {
  return [
    {
      areaId: "dhanmondi",
      kind: "off",
      at: new Date(now.getTime() - minutesAgoOff * 60_000).toISOString(),
    },
    {
      areaId: "dhanmondi",
      kind: "on",
      at: new Date(now.getTime() - minutesAgoOn * 60_000).toISOString(),
    },
  ];
}

describe("forecastForArea", () => {
  test("Forecast restore minutes come from Off-to-On gaps in the Seed, not a trained model", () => {
    const seed: Report[] = [
      ...offThenOn(90, 50),
      ...offThenOn(200, 160),
    ];
    const forecast = forecastForArea(seed, "dhanmondi", now);
    expect(forecast.typicalRestoreMinutes).toBe(40);
    expect(forecast.sampleHour).toBe(0);
  });

  test("Forecast falls back to 45 minutes when Seed has no restore gaps", () => {
    const seed: Report[] = [
      {
        areaId: "dhanmondi",
        kind: "off",
        at: new Date(now.getTime() - 10 * 60_000).toISOString(),
      },
    ];
    expect(forecastForArea(seed, "dhanmondi", now).typicalRestoreMinutes).toBe(
      45,
    );
  });
});
