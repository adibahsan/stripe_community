import type { AreaId, Eta, Status } from "./types";

export type Locale = "en" | "bn";

export const LOCALE_STORAGE_KEY = "batti-locale-v1";

export type Messages = {
  brand: string;
  dhaka: string;
  samplePattern: string;
  map: string;
  list: string;
  forecast: string;
  dockHint: (area: string) => string;
  powerOn: string;
  powerOff: string;
  unsure: string;
  report: string;
  eta: string;
  reportSaved: (kind: string, area: string) => string;
  statusNow: (status: string) => string;
  forecastLine: (minutes: number) => string;
  forecastSeedNote: (count: number, hour: number) => string;
  runningForecast: string;
  forecastSub: string;
  askBattiAboutThis: string;
  close: string;
  askBatti: string;
  selectedArea: string;
  privacy: string;
  tryAsking: string;
  askLabel: string;
  send: string;
  you: string;
  thinking: string;
  responseIncomplete: string;
  couldNotComplete: string;
  incompleteMark: string;
  draftFor: (area: string, kind: string) => string;
  draftNote: string;
  confirm: string;
  cancel: string;
  reportSubmitted: string;
  viewMap: string;
  keepAsking: string;
  fallbackNote: string;
  retry: string;
  remaining: (left: number, total: number) => string;
  sessionLimit: string;
  languageEn: string;
  languageBn: string;
  hourStripLabel: string;
  areas: Record<AreaId, string>;
  status: Record<Status, string>;
  kind: Record<"on" | "off" | "unsure", string>;
};

const EN_AREAS: Record<AreaId, string> = {
  dhanmondi: "Dhanmondi",
  gulshan: "Gulshan",
  banani: "Banani",
  "mirpur-10": "Mirpur-10",
  uttara: "Uttara",
  mohammadpur: "Mohammadpur",
  motijheel: "Motijheel",
  lalbagh: "Lalbagh",
  bashundhara: "Bashundhara",
  tejgaon: "Tejgaon",
  badda: "Badda",
  wari: "Wari",
};

const BN_AREAS: Record<AreaId, string> = {
  dhanmondi: "ধানমন্ডি",
  gulshan: "গুলশান",
  banani: "বনানী",
  "mirpur-10": "মিরপুর-১০",
  uttara: "উত্তরা",
  mohammadpur: "মোহাম্মদপুর",
  motijheel: "মতিঝিল",
  lalbagh: "লালবাগ",
  bashundhara: "বসুন্ধরা",
  tejgaon: "তেজগাঁও",
  badda: "বাড্ডা",
  wari: "ওয়ারী",
};

const EN: Messages = {
  brand: "Batti",
  dhaka: "Dhaka",
  samplePattern: "Sample pattern",
  map: "Map",
  list: "List",
  forecast: "Forecast",
  dockHint: (area) => `Tap what you see in ${area}. Unsure does not vote.`,
  powerOn: "Power on",
  powerOff: "Power off",
  unsure: "Unsure",
  report: "Report",
  eta: "Eta",
  reportSaved: (kind, area) => `Saved ${kind} for ${area}`,
  statusNow: (status) => `Status now: ${status}`,
  forecastLine: (minutes) =>
    `At this hour this Area usually returns in about ${minutes} min`,
  forecastSeedNote: (count, hour) =>
    ` · ${count} Off marks in the Seed at ${hour}:00 Dhaka`,
  runningForecast: "Running forecast…",
  forecastSub: "Sample pattern, not a trained model",
  askBattiAboutThis: "Ask Batti about this",
  close: "Close",
  askBatti: "Ask Batti",
  selectedArea: "Selected Area",
  privacy:
    "Your message and selected Area are sent to an AI provider. Batti does not store conversation history server-side.",
  tryAsking: "Try asking:",
  askLabel: "Ask in Bangla, English, or Banglish",
  send: "Send",
  you: "You",
  thinking: "Thinking…",
  responseIncomplete: "Response incomplete.",
  couldNotComplete: "I could not complete that response.",
  incompleteMark: " (incomplete)",
  draftFor: (area, kind) => `Report draft for ${area}: ${kind}`,
  draftNote: "This Report counts toward Status for 30 minutes.",
  confirm: "Confirm",
  cancel: "Cancel",
  reportSubmitted: "Report submitted.",
  viewMap: "View Map",
  keepAsking: "Keep asking",
  fallbackNote:
    "Sample pattern Eta, with Crowd Reports on top. AI is unavailable right now.",
  retry: "Retry",
  remaining: (left, total) => `${left} of ${total} messages remaining`,
  sessionLimit: "Session limit reached. Refresh to start a new session.",
  languageEn: "EN",
  languageBn: "বাংলা",
  hourStripLabel: "Last six hours, sample pattern",
  areas: EN_AREAS,
  status: { on: "on", off: "off", stale: "stale" },
  kind: { on: "On", off: "Off", unsure: "Unsure" },
};

const BN: Messages = {
  brand: "বত্তি",
  dhaka: "ঢাকা",
  samplePattern: "নমুনা প্যাটার্ন",
  map: "মানচিত্র",
  list: "তালিকা",
  forecast: "পূর্বাভাস",
  dockHint: (area) =>
    `${area}-এ যা দেখছেন ট্যাপ করুন। অনিশ্চিত ভোট গণনা হয় না।`,
  powerOn: "বিদ্যুৎ আছে",
  powerOff: "বিদ্যুৎ নেই",
  unsure: "অনিশ্চিত",
  report: "রিপোর্ট",
  eta: "সম্ভাব্য সময়",
  reportSaved: (kind, area) => `${area}-এর জন্য ${kind} সংরক্ষিত`,
  statusNow: (status) => `এখন অবস্থা: ${status}`,
  forecastLine: (minutes) =>
    `এই সময়ে এলাকায় সাধারণত প্রায় ${minutes} মিনিটে ফিরে আসে`,
  forecastSeedNote: (count, hour) =>
    ` · সিডে ${hour}:00 ঢাকায় ${count}টি Off চিহ্ন`,
  runningForecast: "পূর্বাভাস চলছে…",
  forecastSub: "নমুনা প্যাটার্ন, প্রশিক্ষিত মডেল নয়",
  askBattiAboutThis: "এটা নিয়ে বত্তিকে জিজ্ঞাসা করুন",
  close: "বন্ধ",
  askBatti: "বত্তিকে জিজ্ঞাসা",
  selectedArea: "নির্বাচিত এলাকা",
  privacy:
    "আপনার বার্তা ও নির্বাচিত এলাকা একটি AI প্রদানকারীর কাছে যায়। বত্তি সার্ভারে কথোপকথন সংরক্ষণ করে না।",
  tryAsking: "এভাবে জিজ্ঞাসা করে দেখুন:",
  askLabel: "বাংলা, ইংরেজি বা বাংলিশে জিজ্ঞাসা করুন",
  send: "পাঠান",
  you: "আপনি",
  thinking: "ভাবছি…",
  responseIncomplete: "উত্তর অসম্পূর্ণ।",
  couldNotComplete: "উত্তর শেষ করা যায়নি।",
  incompleteMark: " (অসম্পূর্ণ)",
  draftFor: (area, kind) => `${area}-এর রিপোর্ট খসড়া: ${kind}`,
  draftNote: "এই রিপোর্ট ৩০ মিনিট Status-এ গণনা হবে।",
  confirm: "নিশ্চিত",
  cancel: "বাতিল",
  reportSubmitted: "রিপোর্ট জমা হয়েছে।",
  viewMap: "মানচিত্র দেখুন",
  keepAsking: "আরও জিজ্ঞাসা",
  fallbackNote:
    "নমুনা প্যাটার্নের Eta, উপরে Crowd রিপোর্ট। AI এখন পাওয়া যাচ্ছে না।",
  retry: "আবার চেষ্টা",
  remaining: (left, total) => `${total}-এর মধ্যে ${left}টি বার্তা বাকি`,
  sessionLimit: "সেশনের সীমা শেষ। নতুন সেশনের জন্য রিফ্রেশ করুন।",
  languageEn: "EN",
  languageBn: "বাংলা",
  hourStripLabel: "গত ছয় ঘণ্টা, নমুনা প্যাটার্ন",
  areas: BN_AREAS,
  status: { on: "চালু", off: "বন্ধ", stale: "পুরনো" },
  kind: { on: "চালু", off: "বন্ধ", unsure: "অনিশ্চিত" },
};

const BY_LOCALE: Record<Locale, Messages> = { en: EN, bn: BN };

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "bn";
}

export function resolveLocale(
  stored: string | null | undefined,
  browserLang?: string | null,
): Locale {
  if (isLocale(stored)) return stored;
  if (browserLang?.toLowerCase().startsWith("bn")) return "bn";
  return "en";
}

export function loadLocale(): Locale {
  if (typeof window === "undefined") return "en";
  return resolveLocale(
    window.localStorage.getItem(LOCALE_STORAGE_KEY),
    window.navigator.language,
  );
}

export function saveLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function messagesFor(locale: Locale): Messages {
  return BY_LOCALE[isLocale(locale) ? locale : "en"];
}

export function areaName(locale: Locale, areaId: AreaId): string {
  return messagesFor(locale).areas[areaId];
}

export function formatEtaLocalized(eta: Eta, locale: Locale): string {
  const on = locale === "bn" ? "চালু" : "On";
  const off = locale === "bn" ? "বন্ধ" : "Off";
  const verb = eta.direction === "on" ? on : off;
  if (eta.minutes < 30) {
    return locale === "bn" ? `শীঘ্রই ${verb}` : `${verb} soon`;
  }
  if (eta.minutes < 60) {
    return locale === "bn"
      ? `~${eta.minutes} মিনিটে ${verb}`
      : `${verb} in ~${eta.minutes}m`;
  }
  const hours = Math.round(eta.minutes / 60);
  return locale === "bn"
    ? `~${hours} ঘণ্টায় ${verb}`
    : `${verb} in ~${hours}h`;
}

export const ASSISTANT_EXAMPLES: Record<Locale, string[]> = {
  en: [
    "Dhanmondi te batti ache?",
    "Current chole gese",
    "Outage er jonno ki prepare korbo?",
  ],
  bn: [
    "ধানমন্ডিতে বিদ্যুৎ আছে?",
    "কারেন্ট চলে গেছে",
    "লোডশেডিংয়ের জন্য কী প্রস্তুতি নেব?",
  ],
};
