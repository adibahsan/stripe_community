export type HourState = "on" | "off";

function offAt(...hours: number[]): HourState[] {
  const curve: HourState[] = Array.from({ length: 24 }, () => "on");
  for (const hour of hours) curve[hour] = "off";
  return curve;
}

/** Sample pattern: winter light, pre-monsoon heavy. Not DESCO. Month is 1–12. */
const MONTH_CURVES: readonly HourState[][] = [
  offAt(18, 19, 20),
  offAt(18, 19, 20, 21),
  offAt(17, 18, 19, 20, 21),
  offAt(12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23),
  offAt(11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23),
  offAt(10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23),
  offAt(11, 12, 13, 14, 15, 19, 20, 21, 22),
  offAt(12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23),
  offAt(13, 14, 15, 16, 18, 19, 20, 21, 22),
  offAt(17, 18, 19, 20, 21, 22),
  offAt(18, 19, 20, 21),
  offAt(18, 19, 20),
];

export function curveForMonth(
  month: number,
  areaIndex: number,
): HourState[] {
  const index = ((Math.trunc(month) - 1) % 12 + 12) % 12;
  const base = MONTH_CURVES[index];
  const shift = ((areaIndex % 3) + 3) % 3;
  if (shift === 0) return [...base];
  return base.map((_, hour) => base[(hour - shift + 24) % 24]);
}
