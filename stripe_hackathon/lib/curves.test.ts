import { describe, expect, test } from "vitest";
import { curveForMonth } from "./curves";

function offCount(month: number): number {
  return curveForMonth(month, 0).filter((hour) => hour === "off").length;
}

describe("curveForMonth", () => {
  test("January 10:00 is On — winter mornings stay lit", () => {
    expect(curveForMonth(1, 0)[10]).toBe("on");
  });

  test("January 18:00 is Off — even a light month has an evening peak", () => {
    expect(curveForMonth(1, 0)[18]).toBe("off");
  });

  test("April 14:00 is Off — hot months cut in the afternoon", () => {
    expect(curveForMonth(4, 0)[14]).toBe("off");
  });

  test("April has more Off hours than January", () => {
    expect(offCount(4)).toBeGreaterThan(offCount(1));
  });

  test("areaIndex 1 is a one-hour shift of the base month curve", () => {
    const base = curveForMonth(1, 0);
    const shifted = curveForMonth(1, 1);
    expect(shifted[19]).toBe(base[18]);
  });
});
