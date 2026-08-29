// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ReportKind } from "@/lib/types";
import { messagesFor } from "@/lib/i18n";
import { FloatingReportControl } from "./FloatingReportControl";

const globalsCssPath = resolve(process.cwd(), "app/globals.css");

let touchTargetStyle: HTMLStyleElement | null = null;

beforeEach(() => {
  const css = readFileSync(globalsCssPath, "utf8");
  const block = css.match(/\.bubble\s*\{[^}]+\}/);
  expect(block).not.toBeNull();
  touchTargetStyle = document.createElement("style");
  touchTargetStyle.textContent = block![0];
  document.head.appendChild(touchTargetStyle);
});

afterEach(() => {
  touchTargetStyle?.remove();
  touchTargetStyle = null;
  cleanup();
});

function Harness({ onSubmit }: { onSubmit: (kind: ReportKind) => void }) {
  const [open, setOpen] = useState(false);
  const copy = messagesFor("en");

  return (
    <FloatingReportControl
      open={open}
      onOpenChange={setOpen}
      onSubmit={onSubmit}
      copy={{
        report: copy.report,
        powerOn: copy.powerOn,
        powerOff: copy.powerOff,
        unsure: copy.unsure,
      }}
    />
  );
}

test("report trigger meets 44px minimum touch target", () => {
  render(<Harness onSubmit={vi.fn()} />);
  const trigger = screen.getByRole("button", { name: "Report" });
  const style = window.getComputedStyle(trigger);
  expect(style.minHeight).toBe("44px");
  expect(style.minWidth).toBe("44px");
});

test("expands, focuses the first action, and submits once", async () => {
  const onSubmit = vi.fn();
  render(<Harness onSubmit={onSubmit} />);

  fireEvent.click(screen.getByRole("button", { name: "Report" }));
  await waitFor(() => {
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Power on" }),
    );
  });

  fireEvent.click(screen.getByRole("button", { name: "Power off" }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit).toHaveBeenCalledWith("off");
  expect(screen.queryByRole("button", { name: "Power on" })).toBeNull();
});

test.each(["Escape", "outside", "trigger"] as const)(
  "cancels with %s and returns focus without submitting",
  async (method) => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Report" }));
    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Power on" }),
      );
    });

    if (method === "Escape") {
      fireEvent.keyDown(document, { key: "Escape" });
    } else if (method === "outside") {
      fireEvent.pointerDown(document.body);
    } else {
      fireEvent.click(screen.getByRole("button", { name: "Report" }));
    }

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByRole("button", { name: "Report" }),
      );
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Power on" })).toBeNull();
  },
);
