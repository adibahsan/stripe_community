import { describe, expect, test } from "vitest";
import { etaForArea, formatEta } from "./eta";

/** Evening-peak fixture: On until 18:00 Dhaka, Off 18:00–22:00, On after. */
const eveningPeak = [
  ...Array<"on" | "off">(18).fill("on"),
  "off",
  "off",
  "off",
  "off",
  "on",
  "on",
] as const;

describe("etaForArea", () => {
  test("On Status at 16:00 Dhaka is Off in 120 minutes on an evening-peak curve", () => {
    const at = new Date("2026-08-29T10:00:00.000Z");
    expect(etaForArea(eveningPeak, at, "on")).toEqual({
      direction: "off",
      minutes: 120,
    });
  });

  test("Off Status at 19:00 Dhaka is On in 180 minutes on an evening-peak curve", () => {
    const at = new Date("2026-08-29T13:00:00.000Z");
    expect(etaForArea(eveningPeak, at, "off")).toEqual({
      direction: "on",
      minutes: 180,
    });
  });

  test("Stale Status uses the curve only: 16:00 Dhaka is Off in 120 minutes", () => {
    const at = new Date("2026-08-29T10:00:00.000Z");
    expect(etaForArea(eveningPeak, at, "stale")).toEqual({
      direction: "off",
      minutes: 120,
    });
  });

  test("On Status at 16:30 Dhaka subtracts elapsed minutes in the hour", () => {
    const at = new Date("2026-08-29T10:30:00.000Z");
    expect(etaForArea(eveningPeak, at, "on")).toEqual({
      direction: "off",
      minutes: 90,
    });
  });
});

describe("formatEta", () => {
  test("120 minutes Off prints Off in ~2h", () => {
    expect(formatEta({ direction: "off", minutes: 120 })).toBe("Off in ~2h");
  });

  test("180 minutes On prints On in ~3h", () => {
    expect(formatEta({ direction: "on", minutes: 180 })).toBe("On in ~3h");
  });

  test("under 30 minutes prints soon", () => {
    expect(formatEta({ direction: "off", minutes: 0 })).toBe("Off soon");
  });
});
