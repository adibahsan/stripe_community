import { describe, expect, test } from "vitest";
import {
  ASSISTANT_EXAMPLES,
  areaName,
  formatEtaLocalized,
  isLocale,
  loadLocale,
  messagesFor,
  resolveLocale,
  saveLocale,
} from "./i18n";

describe("resolveLocale", () => {
  test("prefers a valid stored locale", () => {
    expect(resolveLocale("bn", "en-US")).toBe("bn");
    expect(resolveLocale("en", "bn")).toBe("en");
  });

  test("falls back to browser Bangla, then English", () => {
    expect(resolveLocale(null, "bn-BD")).toBe("bn");
    expect(resolveLocale("nope", "bn")).toBe("bn");
    expect(resolveLocale(undefined, "en-GB")).toBe("en");
    expect(resolveLocale(null, null)).toBe("en");
  });
});

describe("messagesFor", () => {
  test("returns complete Area labels for both locales", () => {
    const en = messagesFor("en");
    const bn = messagesFor("bn");
    expect(Object.keys(en.areas)).toHaveLength(12);
    expect(Object.keys(bn.areas)).toHaveLength(12);
    expect(en.areas.dhanmondi).toBe("Dhanmondi");
    expect(bn.areas.dhanmondi).toBe("ধানমন্ডি");
    expect(areaName("bn", "mirpur-10")).toBe("মিরপুর-১০");
  });

  test("covers Assistant chrome keys", () => {
    const bn = messagesFor("bn");
    expect(bn.askBatti).toBeTruthy();
    expect(bn.privacy).toContain("AI");
    expect(bn.confirm).toBeTruthy();
    expect(bn.sessionLimit).toBeTruthy();
    expect(ASSISTANT_EXAMPLES.bn).toHaveLength(3);
  });

  test("invalid locale argument falls back to English messages", () => {
    expect(messagesFor("xx" as "en").brand).toBe("Batti");
  });
});

describe("formatEtaLocalized", () => {
  test("formats soon, minutes, and hours in both locales", () => {
    expect(formatEtaLocalized({ direction: "off", minutes: 10 }, "en")).toBe(
      "Off soon",
    );
    expect(formatEtaLocalized({ direction: "on", minutes: 45 }, "en")).toBe(
      "On in ~45m",
    );
    expect(formatEtaLocalized({ direction: "off", minutes: 120 }, "en")).toBe(
      "Off in ~2h",
    );
    expect(formatEtaLocalized({ direction: "off", minutes: 10 }, "bn")).toBe(
      "শীঘ্রই বন্ধ",
    );
    expect(formatEtaLocalized({ direction: "on", minutes: 120 }, "bn")).toBe(
      "~2 ঘণ্টায় চালু",
    );
  });
});

describe("locale persistence helpers", () => {
  test("isLocale narrows only en and bn", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("bn")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });

  test("loadLocale defaults to English without window storage", () => {
    expect(loadLocale()).toBe("en");
    saveLocale("bn");
    expect(loadLocale()).toBe("en");
  });
});
