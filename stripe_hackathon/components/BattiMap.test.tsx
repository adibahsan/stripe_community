// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { AREAS } from "@/lib/areas";
import { messagesFor } from "@/lib/i18n";
import type { Eta, Status } from "@/lib/types";
import BattiMap from "./BattiMap";

const copy = messagesFor("en");
const statusByArea: Record<string, Status> = Object.fromEntries(
  AREAS.map((area) => [area.id, "on" as Status]),
);
const etaByArea: Record<string, Eta> = Object.fromEntries(
  AREAS.map((area) => [area.id, { direction: "off", minutes: 300 } as Eta]),
);

function pinnedNames() {
  return [...document.querySelectorAll(".leaflet-tooltip .tip-name")].map(
    (node) => node.textContent,
  );
}

function renderMap(selectedId: string) {
  const area = AREAS.find((candidate) => candidate.id === selectedId) ?? AREAS[0];
  return (
    <BattiMap
      areas={AREAS}
      labels={copy.areas}
      statusByArea={statusByArea}
      etaByArea={etaByArea}
      selectedId={selectedId}
      onSelect={() => {}}
      center={[area.lat, area.lng]}
      locale="en"
    />
  );
}

beforeEach(() => {
  vi.stubGlobal("React", React);
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("pins exactly one Area label and moves it when selection changes", () => {
  const { rerender } = render(renderMap("dhanmondi"));
  expect(pinnedNames()).toEqual(["Dhanmondi"]);

  rerender(renderMap("gulshan"));
  expect(pinnedNames()).toEqual(["Gulshan"]);

  rerender(renderMap("wari"));
  expect(pinnedNames()).toEqual(["Wari"]);
});
