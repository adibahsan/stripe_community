const DHAKA = "Asia/Dhaka";

function dhakaPart(at: Date, type: "hour" | "minute" | "month"): number {
  const value = new Intl.DateTimeFormat("en-GB", {
    timeZone: DHAKA,
    hour: "numeric",
    minute: "numeric",
    month: "numeric",
    hourCycle: "h23",
  })
    .formatToParts(at)
    .find((part) => part.type === type)?.value;
  return Number(value ?? 0);
}

export function dhakaHour(at: Date): number {
  return dhakaPart(at, "hour");
}

export function dhakaMinute(at: Date): number {
  return dhakaPart(at, "minute");
}

export function dhakaMonth(at: Date): number {
  return dhakaPart(at, "month") || 1;
}

export function formatDhakaClock(at: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: DHAKA,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
}
