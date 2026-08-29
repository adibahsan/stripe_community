"use client";

import React, { useEffect, useRef } from "react";
import type { Messages } from "@/lib/i18n";
import type { ReportKind } from "@/lib/types";

export type FloatingReportControlProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (kind: ReportKind) => void;
  copy: Pick<Messages, "report" | "powerOn" | "powerOff" | "unsure">;
};

export function FloatingReportControl({
  open,
  onOpenChange,
  onSubmit,
  copy,
}: FloatingReportControlProps): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstActionRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open) {
      firstActionRef.current?.focus();
    } else if (wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, onOpenChange]);

  function submit(kind: ReportKind) {
    onSubmit(kind);
    onOpenChange(false);
  }

  return (
    <div ref={rootRef} className="report-control">
      {open ? (
        <div className="report-actions" aria-label={copy.report}>
          <button
            ref={firstActionRef}
            className="tap on"
            onClick={() => submit("on")}
          >
            {copy.powerOn}
          </button>
          <button className="tap off" onClick={() => submit("off")}>
            {copy.powerOff}
          </button>
          <button className="tap unsure" onClick={() => submit("unsure")}>
            {copy.unsure}
          </button>
        </div>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        className="bubble report-trigger"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        {copy.report}
      </button>
    </div>
  );
}
