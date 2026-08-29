import { describe, expect, test } from "vitest";
import {
  FUTURE_MS,
  PAST_MS,
  STEP_MS,
  clampViewTime,
  isLive,
  isPrediction,
  snapViewTime,
  stepViewTime,
  timelineEnd,
  timelineStart,
} from "./timeline";

const now = new Date("2026-08-30T12:00:00.000Z");

describe("timeline window", () => {
  test("spans 7 days back and 3 days ahead of now", () => {
    expect(now.getTime() - timelineStart(now).getTime()).toBe(PAST_MS);
    expect(timelineEnd(now).getTime() - now.getTime()).toBe(FUTURE_MS);
    expect(PAST_MS).toBe(7 * 24 * 60 * 60_000);
    expect(FUTURE_MS).toBe(3 * 24 * 60 * 60_000);
  });

  test("clamp keeps view time inside the window", () => {
    expect(clampViewTime(now, new Date(now.getTime() - PAST_MS - 1)).getTime()).toBe(
      now.getTime() - PAST_MS,
    );
    expect(clampViewTime(now, new Date(now.getTime() + FUTURE_MS + 1)).getTime()).toBe(
      now.getTime() + FUTURE_MS,
    );
    expect(clampViewTime(now, now).getTime()).toBe(now.getTime());
  });

  test("snap and step move in 15-minute ticks", () => {
    const odd = new Date(now.getTime() + 7 * 60_000);
    const snapped = snapViewTime(now, odd);
    expect((snapped.getTime() - timelineStart(now).getTime()) % STEP_MS).toBe(0);

    const next = stepViewTime(now, now, 1);
    expect(next.getTime() - now.getTime()).toBe(STEP_MS);
    const prev = stepViewTime(now, now, -1);
    expect(now.getTime() - prev.getTime()).toBe(STEP_MS);
  });

  test("prediction is strictly after now; live is within half a step", () => {
    expect(isPrediction(now, now)).toBe(false);
    expect(isPrediction(now, new Date(now.getTime() + 1))).toBe(true);
    expect(isLive(now, now)).toBe(true);
    expect(isLive(now, new Date(now.getTime() + STEP_MS))).toBe(false);
  });
});
