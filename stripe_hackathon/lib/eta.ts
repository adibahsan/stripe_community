import type { HourState } from "./curves";
import { dhakaHour, dhakaMinute } from "./dhaka-time";
import type { Eta, Status } from "./types";

export function etaForArea(
  curve: readonly HourState[],
  at: Date,
  status: Status,
): Eta {
  const hour = dhakaHour(at);
  const minute = dhakaMinute(at);
  const effective: HourState =
    status === "stale" ? (curve[hour] ?? "on") : status;
  const direction: HourState = effective === "on" ? "off" : "on";

  for (let i = 0; i < 24; i++) {
    const h = (hour + i) % 24;
    if (curve[h] !== direction) continue;
    if (i === 0) return { direction, minutes: 0 };
    return { direction, minutes: i * 60 - minute };
  }

  return { direction, minutes: 24 * 60 - minute };
}

export function formatEta(eta: Eta): string {
  const verb = eta.direction === "on" ? "On" : "Off";
  if (eta.minutes < 30) return `${verb} soon`;
  if (eta.minutes < 60) return `${verb} in ~${eta.minutes}m`;
  return `${verb} in ~${Math.round(eta.minutes / 60)}h`;
}
