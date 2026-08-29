export const PAST_MS = 7 * 24 * 60 * 60_000;
export const FUTURE_MS = 3 * 24 * 60 * 60_000;
export const STEP_MS = 15 * 60_000;
export const SEED_STEP_MINUTES = 20;

export function timelineStart(now: Date): Date {
  return new Date(now.getTime() - PAST_MS);
}

export function timelineEnd(now: Date): Date {
  return new Date(now.getTime() + FUTURE_MS);
}

export function clampViewTime(now: Date, view: Date): Date {
  const t = view.getTime();
  const lo = now.getTime() - PAST_MS;
  const hi = now.getTime() + FUTURE_MS;
  return new Date(Math.min(hi, Math.max(lo, t)));
}

export function snapViewTime(now: Date, view: Date): Date {
  const start = now.getTime() - PAST_MS;
  const snapped =
    start + Math.round((view.getTime() - start) / STEP_MS) * STEP_MS;
  return clampViewTime(now, new Date(snapped));
}

export function stepViewTime(now: Date, view: Date, steps: number): Date {
  return snapViewTime(
    now,
    new Date(view.getTime() + steps * STEP_MS),
  );
}

export function isPrediction(now: Date, view: Date): boolean {
  return view.getTime() > now.getTime();
}

export function isLive(now: Date, view: Date): boolean {
  return Math.abs(view.getTime() - now.getTime()) < STEP_MS / 2;
}
