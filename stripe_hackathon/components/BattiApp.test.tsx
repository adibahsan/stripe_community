// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { AreaId } from "@/lib/types";
import { BattiApp } from "./BattiApp";

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockBattiMap({
      onSelect,
    }: {
      onSelect: (id: AreaId) => void;
    }) {
      return (
        <div data-testid="map">
          <button type="button" onClick={() => onSelect("gulshan")}>
            Select Gulshan on map
          </button>
        </div>
      );
    },
}));

vi.mock("./ForecastSheet", () => ({
  ForecastSheet: ({
    onClose,
    phase,
  }: {
    onClose: () => void;
    phase: "spin" | "ready";
  }) => (
    <div role="dialog" aria-label="Forecast">
      <p>{phase === "spin" ? "Running forecast…" : "Forecast ready"}</p>
      <button type="button" onClick={onClose}>
        Close Forecast
      </button>
    </div>
  ),
}));

vi.mock("./BattiAssistant", () => ({
  BattiAssistant: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (
    <>
      <button type="button" onClick={() => onOpenChange(true)}>
        Ask Batti
      </button>
      {open ? (
        <div role="dialog" aria-label="Ask Batti">
          <button type="button" onClick={() => onOpenChange(false)}>
            Close Ask Batti
          </button>
        </div>
      ) : null}
    </>
  ),
}));

function stubMatchMedia(reduce: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: reduce,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
}

beforeEach(() => {
  vi.stubGlobal("React", React);
  window.localStorage.clear();
  stubMatchMedia(true);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllTimers();
  vi.useRealTimers();
});

test("map selection updates the status chip without opening Forecast", async () => {
  render(<BattiApp />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Select Gulshan on map" }),
  );

  expect(
    screen.getByRole("button", { name: /Forecast.*Gulshan/i }),
  ).toBeTruthy();
  expect(screen.queryByRole("dialog", { name: "Forecast" })).toBeNull();
});

test("opens Forecast only from an explicit Forecast control", async () => {
  render(<BattiApp />);
  fireEvent.click(
    await screen.findByRole("button", { name: /Forecast.*Dhanmondi/i }),
  );

  expect(screen.getByRole("dialog", { name: "Forecast" })).toBeTruthy();
  expect(screen.getByTestId("map")).toBeTruthy();
});

test("List selection closes List and leaves Forecast closed", async () => {
  render(<BattiApp />);
  fireEvent.click(await screen.findByRole("button", { name: "List" }));
  fireEvent.click(
    within(screen.getByRole("dialog", { name: "List" })).getByRole("button", {
      name: /Gulshan/,
    }),
  );

  expect(screen.queryByRole("dialog", { name: "List" })).toBeNull();
  expect(screen.queryByRole("dialog", { name: "Forecast" })).toBeNull();
  expect(
    screen.getByRole("button", { name: /Forecast.*Gulshan/i }),
  ).toBeTruthy();
});

test("keeps only List, Forecast, or Ask Batti open", async () => {
  render(<BattiApp />);
  fireEvent.click(await screen.findByRole("button", { name: "List" }));
  expect(screen.getByTestId("map")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Forecast" }));
  expect(screen.queryByRole("dialog", { name: "List" })).toBeNull();
  expect(screen.getByRole("dialog", { name: "Forecast" })).toBeTruthy();
  expect(screen.getByTestId("map")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Ask Batti" }));
  expect(screen.queryByRole("dialog", { name: "Forecast" })).toBeNull();
  expect(screen.getByRole("dialog", { name: "Ask Batti" })).toBeTruthy();
  expect(screen.getByTestId("map")).toBeTruthy();
});

test("opening Ask Batti collapses expanded Report actions", async () => {
  render(<BattiApp />);
  fireEvent.click(await screen.findByRole("button", { name: "Report" }));
  expect(screen.getByRole("button", { name: "Power on" })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Ask Batti" }));
  expect(screen.queryByRole("button", { name: "Power on" })).toBeNull();
  expect(screen.getByRole("dialog", { name: "Ask Batti" })).toBeTruthy();
});

test("List focuses Close and wraps Tab from the last Area to Close", async () => {
  render(<BattiApp />);
  fireEvent.click(await screen.findByRole("button", { name: "List" }));
  const list = screen.getByRole("dialog", { name: "List" });
  const buttons = within(list).getAllByRole("button");

  await waitFor(() => expect(document.activeElement).toBe(buttons[0]));
  buttons.at(-1)!.focus();
  fireEvent.keyDown(window, { key: "Tab" });

  expect(document.activeElement).toBe(buttons[0]);
});

test("List wraps Shift+Tab from Close to the last Area", async () => {
  render(<BattiApp />);
  fireEvent.click(await screen.findByRole("button", { name: "List" }));
  const buttons = within(
    screen.getByRole("dialog", { name: "List" }),
  ).getAllByRole("button");

  await waitFor(() => expect(document.activeElement).toBe(buttons[0]));
  fireEvent.keyDown(window, { key: "Tab", shiftKey: true });

  expect(document.activeElement).toBe(buttons.at(-1));
});

test("Escape and backdrop close List and restore trigger focus", async () => {
  render(<BattiApp />);
  const listTrigger = await screen.findByRole("button", { name: "List" });
  fireEvent.click(listTrigger);
  await waitFor(() =>
    expect(document.activeElement).toBe(
      within(screen.getByRole("dialog", { name: "List" })).getByRole("button", {
        name: "Close",
      }),
    ),
  );

  fireEvent.keyDown(window, { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "List" })).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(listTrigger));

  fireEvent.click(listTrigger);
  fireEvent.click(screen.getByRole("presentation"));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "List" })).toBeNull());
  await waitFor(() => expect(document.activeElement).toBe(listTrigger));
});

test("Forecast close restores focus to the status chip that opened it", async () => {
  render(<BattiApp />);
  const chip = await screen.findByRole("button", {
    name: /Forecast.*Dhanmondi/i,
  });
  fireEvent.click(chip);

  fireEvent.click(screen.getByRole("button", { name: "Close Forecast" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Forecast" })).toBeNull(),
  );
  await waitFor(() => expect(document.activeElement).toBe(chip));
});

test("Forecast spin reaches ready after 1500ms", async () => {
  stubMatchMedia(false);
  render(<BattiApp />);
  const chip = await screen.findByRole("button", {
    name: /Forecast.*Dhanmondi/i,
  });
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  fireEvent.click(chip);
  expect(screen.getByText("Running forecast…")).toBeTruthy();

  act(() => {
    vi.advanceTimersByTime(1500);
  });
  expect(screen.getByText("Forecast ready")).toBeTruthy();
});

test("opening List before Forecast is ready cancels the spin timer", async () => {
  stubMatchMedia(false);
  render(<BattiApp />);
  const chip = await screen.findByRole("button", {
    name: /Forecast.*Dhanmondi/i,
  });
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  fireEvent.click(chip);
  expect(screen.getByText("Running forecast…")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "List" }));
  expect(screen.queryByRole("dialog", { name: "Forecast" })).toBeNull();
  act(() => {
    vi.advanceTimersByTime(1500);
  });
  expect(screen.queryByRole("dialog", { name: "Forecast" })).toBeNull();
  expect(screen.getByRole("dialog", { name: "List" })).toBeTruthy();
});
