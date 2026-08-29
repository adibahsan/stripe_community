const DHAKA = "Asia/Dhaka";

export function dhakaHour(at: Date): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: DHAKA,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(at)
    .find((part) => part.type === "hour")?.value;
  return Number(hour ?? 0);
}
