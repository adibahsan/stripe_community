import { describe, expect, test } from "vitest";
import { statusForArea } from "./status";
import type { Report } from "./types";

const now = new Date("2026-08-29T18:00:00.000Z");

function report(
  minutesAgo: number,
  kind: Report["kind"],
  areaId: Report["areaId"] = "dhanmondi",
): Report {
  return {
    areaId,
    kind,
    at: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
  };
}

describe("statusForArea", () => {
  test("Crowd sees Stale when an Area has no Report in the last 30 minutes", () => {
    expect(statusForArea([report(31, "off")], now)).toBe("stale");
  });

  test("a Crowd Off Report in an empty window sets Status to Off", () => {
    expect(statusForArea([report(1, "off")], now)).toBe("off");
  });

  test("Crowd sees Off when most recent-window Reports in the Area are Off", () => {
    expect(
      statusForArea([report(5, "off"), report(8, "off"), report(10, "on")], now),
    ).toBe("off");
  });

  test("Crowd sees On when most recent-window Reports in the Area are On", () => {
    expect(
      statusForArea([report(2, "on"), report(4, "on"), report(6, "off")], now),
    ).toBe("on");
  });

  test("Unsure Reports do not vote on Status", () => {
    expect(
      statusForArea(
        [report(3, "unsure"), report(4, "unsure"), report(5, "off")],
        now,
      ),
    ).toBe("off");
  });

  test("Reports for another Area do not change this Area's Status", () => {
    expect(
      statusForArea([report(2, "off", "gulshan")], now, "dhanmondi"),
    ).toBe("stale");
  });

  test("a tie uses the latest On or Off Report in the window", () => {
    expect(statusForArea([report(2, "on"), report(9, "off")], now)).toBe("on");
  });
});
