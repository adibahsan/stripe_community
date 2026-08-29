"use client";

import React, { useEffect, useRef } from "react";

export const GUIDE_STORAGE_KEY = "batti-guide-v1";

export function loadGuideDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GUIDE_STORAGE_KEY) === "1";
}

export function saveGuideDismissed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUIDE_STORAGE_KEY, "1");
}

type Copy = {
  guideTitle: string;
  guideGotIt: string;
  guideMap: string;
  guideMapBody: string;
  guideTimeline: string;
  guideTimelineBody: string;
  guideReport: string;
  guideReportBody: string;
  guideMore: string;
  guideMoreBody: string;
};

export function OnboardingGuide({
  open,
  onDismiss,
  copy,
}: {
  open: boolean;
  onDismiss: () => void;
  copy: Copy;
}) {
  const gotItRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    gotItRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="guide-backdrop" role="presentation" onClick={onDismiss}>
      <div
        className="guide-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="guide-title">{copy.guideTitle}</h2>
        <ul>
          <li>
            <strong>{copy.guideMap}</strong> {copy.guideMapBody}
          </li>
          <li>
            <strong>{copy.guideTimeline}</strong> {copy.guideTimelineBody}
          </li>
          <li>
            <strong>{copy.guideReport}</strong> {copy.guideReportBody}
          </li>
          <li>
            <strong>{copy.guideMore}</strong> {copy.guideMoreBody}
          </li>
        </ul>
        <button ref={gotItRef} type="button" onClick={onDismiss}>
          {copy.guideGotIt}
        </button>
      </div>
    </div>
  );
}
