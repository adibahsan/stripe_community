// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { FUTURE_MS, PAST_MS, STEP_MS } from "@/lib/timeline";
import { TimeScrubber } from "./TimeScrubber";

const now = new Date("2026-08-30T12:00:00.000Z");

const copy = {
  timeline: "Timeline",
  timelineNow: "Now",
  timelinePast: "Past",
  timelinePrediction: "Prediction",
  jumpToNow: "Jump to now",
  samplePattern: "Sample pattern",
};

afterEach(() => {
  cleanup();
});

test("slider value is now's timestamp when viewTime is now", () => {
  render(
    <TimeScrubber now={now} viewTime={now} onChange={vi.fn()} copy={copy} />,
  );
  const slider = screen.getByRole("slider") as HTMLInputElement;
  expect(slider.value).toBe(String(now.getTime()));
});

test("changing the slider fires onChange inside the 7d–3d window", () => {
  const onChange = vi.fn();
  render(
    <TimeScrubber now={now} viewTime={now} onChange={onChange} copy={copy} />,
  );
  const next = now.getTime() - STEP_MS * 4;
  fireEvent.change(screen.getByRole("slider"), {
    target: { value: String(next) },
  });
  expect(onChange).toHaveBeenCalledTimes(1);
  const date = onChange.mock.calls[0][0] as Date;
  expect(date).toBeInstanceOf(Date);
  expect(date.getTime()).toBeGreaterThanOrEqual(now.getTime() - PAST_MS);
  expect(date.getTime()).toBeLessThanOrEqual(now.getTime() + FUTURE_MS);
});

test("Forward then Back move by STEP_MS", () => {
  const onChange = vi.fn();
  render(
    <TimeScrubber now={now} viewTime={now} onChange={onChange} copy={copy} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Forward" }));
  expect(onChange.mock.calls[0][0].getTime()).toBe(now.getTime() + STEP_MS);
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(onChange.mock.calls[1][0].getTime()).toBe(now.getTime() - STEP_MS);
});

test("Jump to now appears in the past and calls onChange(now)", () => {
  const onChange = vi.fn();
  const past = new Date(now.getTime() - STEP_MS);
  render(
    <TimeScrubber now={now} viewTime={past} onChange={onChange} copy={copy} />,
  );
  fireEvent.click(screen.getByRole("button", { name: copy.jumpToNow }));
  expect(onChange).toHaveBeenCalledWith(now);
});

test("prediction label is visible after now, not when live", () => {
  const future = new Date(now.getTime() + STEP_MS);
  const { rerender } = render(
    <TimeScrubber now={now} viewTime={future} onChange={vi.fn()} copy={copy} />,
  );
  expect(screen.getByRole("status").textContent).toBe(copy.samplePattern);

  rerender(
    <TimeScrubber now={now} viewTime={now} onChange={vi.fn()} copy={copy} />,
  );
  expect(screen.queryByRole("status")).toBeNull();
});
