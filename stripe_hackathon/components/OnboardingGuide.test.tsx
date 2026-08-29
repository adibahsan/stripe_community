// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  GUIDE_STORAGE_KEY,
  loadGuideDismissed,
  OnboardingGuide,
  saveGuideDismissed,
} from "./OnboardingGuide";

const copy = {
  guideTitle: "How Batti works",
  guideGotIt: "Got it",
  guideMap: "Map",
  guideMapBody: "Tap a neighborhood outline to select.",
  guideTimeline: "Timeline",
  guideTimelineBody: "Last 7 days, now, and 3 days ahead.",
  guideReport: "Report",
  guideReportBody: "On, Off, or Unsure for the selected Area.",
  guideMore: "More",
  guideMoreBody: "List, Forecast, Ask Batti, EN/বাংলা.",
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

test("renders nothing when closed", () => {
  render(<OnboardingGuide open={false} onDismiss={vi.fn()} copy={copy} />);
  expect(screen.queryByRole("dialog")).toBeNull();
});

test("shows dialog title and four copy headings", () => {
  render(<OnboardingGuide open onDismiss={vi.fn()} copy={copy} />);
  expect(screen.getByRole("dialog", { name: copy.guideTitle })).toBeTruthy();
  expect(screen.getByRole("heading", { name: copy.guideTitle })).toBeTruthy();
  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(4);
  expect(items[0].textContent).toContain(copy.guideMap);
  expect(items[1].textContent).toContain(copy.guideTimeline);
  expect(items[2].textContent).toContain(copy.guideReport);
  expect(items[3].textContent).toContain(copy.guideMore);
});

test("Got it click calls onDismiss", () => {
  const onDismiss = vi.fn();
  render(<OnboardingGuide open onDismiss={onDismiss} copy={copy} />);
  fireEvent.click(screen.getByRole("button", { name: copy.guideGotIt }));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test("Escape calls onDismiss", () => {
  const onDismiss = vi.fn();
  render(<OnboardingGuide open onDismiss={onDismiss} copy={copy} />);
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test("backdrop click calls onDismiss", () => {
  const onDismiss = vi.fn();
  render(<OnboardingGuide open onDismiss={onDismiss} copy={copy} />);
  fireEvent.click(screen.getByRole("presentation"));
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

test("loadGuideDismissed is false until saveGuideDismissed", () => {
  expect(window.localStorage.getItem(GUIDE_STORAGE_KEY)).toBeNull();
  expect(loadGuideDismissed()).toBe(false);
  saveGuideDismissed();
  expect(loadGuideDismissed()).toBe(true);
});
