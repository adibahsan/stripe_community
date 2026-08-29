"use client";

import React from "react";
import { formatDhakaClock } from "@/lib/dhaka-time";
import {
  FUTURE_MS,
  PAST_MS,
  STEP_MS,
  isLive,
  isPrediction,
  snapViewTime,
  stepViewTime,
  timelineEnd,
  timelineStart,
} from "@/lib/timeline";

export type TimeScrubberCopy = {
  timeline: string;
  timelineNow: string;
  timelinePast: string;
  timelinePrediction: string;
  jumpToNow: string;
  samplePattern: string;
};

export function TimeScrubber({
  now,
  viewTime,
  onChange,
  copy,
}: {
  now: Date;
  viewTime: Date;
  onChange: (next: Date) => void;
  copy: TimeScrubberCopy;
}) {
  const clock = formatDhakaClock(viewTime);
  const live = isLive(now, viewTime);

  return (
    <div className="time-scrubber" role="group" aria-label={copy.timeline}>
      <div className="time-scrubber-clock">
        <time dateTime={viewTime.toISOString()}>{clock}</time>
        {isPrediction(now, viewTime) ? (
          <span role="status">{copy.samplePattern}</span>
        ) : null}
      </div>
      <button
        type="button"
        className="bubble time-scrubber-step"
        aria-label="Back"
        disabled={viewTime.getTime() <= timelineStart(now).getTime()}
        onClick={() => onChange(stepViewTime(now, viewTime, -1))}
      >
        Back
      </button>
      <input
        type="range"
        className="time-scrubber-range"
        min={now.getTime() - PAST_MS}
        max={now.getTime() + FUTURE_MS}
        step={STEP_MS}
        value={viewTime.getTime()}
        aria-label={copy.timeline}
        aria-valuetext={clock}
        onChange={(event) =>
          onChange(snapViewTime(now, new Date(Number(event.target.value))))
        }
      />
      <button
        type="button"
        className="bubble time-scrubber-step"
        aria-label="Forward"
        disabled={viewTime.getTime() >= timelineEnd(now).getTime()}
        onClick={() => onChange(stepViewTime(now, viewTime, 1))}
      >
        Forward
      </button>
      {!live ? (
        <button
          type="button"
          className="bubble time-scrubber-now"
          onClick={() => onChange(now)}
        >
          {copy.jumpToNow}
        </button>
      ) : null}
      <div className="time-scrubber-marks" aria-hidden="true">
        <span>{copy.timelinePast}</span>
        <span>{copy.timelineNow}</span>
        <span>{copy.timelinePrediction}</span>
      </div>
    </div>
  );
}
