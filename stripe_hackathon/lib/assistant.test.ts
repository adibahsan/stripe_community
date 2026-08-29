import { describe, expect, test } from "vitest";
import { AREAS } from "./areas";
import {
  buildAssistantAreas,
  validateAssistantRequest,
  validateClassification,
} from "./assistant";
import type { AssistantArea, AssistantRequest } from "./assistant";
import type { AreaId, Report } from "./types";

const now = new Date("2026-08-29T18:00:00.000Z");

function report(
  minutesAgo: number,
  kind: Report["kind"],
  areaId: AreaId = "dhanmondi",
): Report {
  return {
    areaId,
    kind,
    at: new Date(now.getTime() - minutesAgo * 60_000).toISOString(),
  };
}

function emptyCrowdEvidence() {
  return { on: 0, off: 0, unsure: 0, latestMinutesAgo: null };
}

function buildValidAreas(): AssistantArea[] {
  return AREAS.map((area) => ({
    id: area.id,
    name: area.name,
    status: "stale" as const,
    eta: { direction: "on" as const, minutes: 30 },
    crowd: emptyCrowdEvidence(),
  }));
}

function buildValidRequest(): AssistantRequest {
  return {
    selectedAreaId: "dhanmondi",
    areas: buildValidAreas(),
    history: [{ role: "user", content: "Power ki obostha?" }],
    message: "Dhanmondi te batti ache?",
    forecast: {
      areaId: "dhanmondi",
      typicalRestoreMinutes: 45,
      sampleHour: 18,
      offCountAtHour: 3,
    },
  };
}

describe("buildAssistantAreas", () => {
  test("counts Crowd evidence within 30 minutes and ignores older Reports", () => {
    const crowd = [
      report(5, "on"),
      report(10, "off"),
      report(20, "unsure"),
      report(31, "off"),
    ];

    const areas = buildAssistantAreas({
      now,
      crowd,
      statusByArea: { dhanmondi: "off" },
      etaByArea: { dhanmondi: { direction: "on", minutes: 42 } },
    });

    const dhanmondi = areas.find((area) => area.id === "dhanmondi");
    expect(dhanmondi).toBeDefined();
    expect(dhanmondi!.crowd).toEqual({
      on: 1,
      off: 1,
      unsure: 1,
      latestMinutesAgo: 5,
    });
    expect(dhanmondi!.status).toBe("off");
    expect(dhanmondi!.eta).toEqual({ direction: "on", minutes: 42 });
  });

  test("uses AREAS for ids and display names", () => {
    const areas = buildAssistantAreas({
      now,
      crowd: [],
      statusByArea: {},
      etaByArea: {},
    });

    expect(areas).toHaveLength(12);
    expect(areas.map((area) => area.id)).toEqual(AREAS.map((area) => area.id));
    expect(areas.map((area) => area.name)).toEqual(AREAS.map((area) => area.name));
  });

  test("defaults status to stale and eta when missing", () => {
    const areas = buildAssistantAreas({
      now,
      crowd: [],
      statusByArea: {},
      etaByArea: {},
    });

    for (const area of areas) {
      expect(area.status).toBe("stale");
      expect(area.crowd).toEqual(emptyCrowdEvidence());
    }
  });
});

describe("validateAssistantRequest", () => {
  test("accepts a valid request with 12 unique Areas and trimmed message", () => {
    const valid = buildValidRequest();
    expect(validateAssistantRequest(valid)).toEqual(valid);
  });

  test("accepts at most six history messages", () => {
    const valid = buildValidRequest();
    valid.history = Array(6).fill({ role: "user", content: "Hi" });
    expect(validateAssistantRequest(valid)).not.toBeNull();
  });

  test("rejects invalid requests", () => {
    const valid = buildValidRequest();

    expect(validateAssistantRequest({ ...valid, selectedAreaId: "unknown" })).toBeNull();
    expect(
      validateAssistantRequest({
        ...valid,
        history: Array(7).fill(valid.history[0]),
      }),
    ).toBeNull();
    expect(validateAssistantRequest({ ...valid, message: "" })).toBeNull();
    expect(validateAssistantRequest({ ...valid, message: "x".repeat(1001) })).toBeNull();
    expect(validateAssistantRequest({ ...valid, areas: valid.areas.slice(1) })).toBeNull();
  });

  test("trims the message before validation", () => {
    const valid = buildValidRequest();
    valid.message = "  hello  ";
    expect(validateAssistantRequest(valid)?.message).toBe("hello");
  });

  test("rejects Area names that do not match canonical AREAS names", () => {
    const valid = buildValidRequest();
    const areas = buildValidAreas();
    areas[0] = { ...areas[0], name: "Fake Dhanmondi" };
    expect(validateAssistantRequest({ ...valid, areas })).toBeNull();
  });

  test("rejects crowd counts that are not non-negative integers", () => {
    const valid = buildValidRequest();
    const areas = buildValidAreas();

    expect(
      validateAssistantRequest({
        ...valid,
        areas: areas.map((area, index) =>
          index === 0
            ? { ...area, crowd: { ...area.crowd, on: -1 } }
            : area,
        ),
      }),
    ).toBeNull();

    expect(
      validateAssistantRequest({
        ...valid,
        areas: areas.map((area, index) =>
          index === 0
            ? { ...area, crowd: { ...area.crowd, off: 1.5 } }
            : area,
        ),
      }),
    ).toBeNull();

    expect(
      validateAssistantRequest({
        ...valid,
        areas: areas.map((area, index) =>
          index === 0
            ? { ...area, crowd: { ...area.crowd, unsure: Number.NaN } }
            : area,
        ),
      }),
    ).toBeNull();
  });

  test("rejects history messages with empty or overlong trimmed content", () => {
    const valid = buildValidRequest();

    expect(
      validateAssistantRequest({
        ...valid,
        history: [{ role: "user", content: "" }],
      }),
    ).toBeNull();

    expect(
      validateAssistantRequest({
        ...valid,
        history: [{ role: "user", content: "   " }],
      }),
    ).toBeNull();

    expect(
      validateAssistantRequest({
        ...valid,
        history: [{ role: "user", content: "x".repeat(1001) }],
      }),
    ).toBeNull();

    expect(
      validateAssistantRequest({
        ...valid,
        history: [{ role: "user", content: `  ${"x".repeat(1001)}  ` }],
      }),
    ).toBeNull();
  });

  test("trims history message content before validation", () => {
    const valid = buildValidRequest();
    valid.history = [{ role: "assistant", content: "  Ki obostha?  " }];
    expect(validateAssistantRequest(valid)?.history[0].content).toBe("Ki obostha?");
  });
});

describe("validateClassification", () => {
  test("accepts a valid report classification", () => {
    const request = buildValidRequest();

    expect(
      validateClassification(
        {
          intent: "report",
          areaId: "dhanmondi",
          reportKind: "off",
          language: "mixed",
        },
        request,
      ),
    ).toEqual({
      intent: "report",
      areaId: "dhanmondi",
      reportKind: "off",
      language: "mixed",
    });
  });

  test("rejects unknown Areas", () => {
    const request = buildValidRequest();

    expect(
      validateClassification(
        {
          intent: "question",
          areaId: "unknown",
          reportKind: null,
          language: "en",
        },
        request,
      ),
    ).toBeNull();
  });

  test("rejects invalid report kinds", () => {
    const request = buildValidRequest();

    expect(
      validateClassification(
        {
          intent: "report",
          areaId: "dhanmondi",
          reportKind: "maybe",
          language: "en",
        },
        request,
      ),
    ).toBeNull();
  });

  test("rejects non-null reportKind for questions", () => {
    const request = buildValidRequest();

    expect(
      validateClassification(
        {
          intent: "question",
          areaId: "dhanmondi",
          reportKind: "off",
          language: "en",
        },
        request,
      ),
    ).toBeNull();
  });

  test("rejects null reportKind for reports", () => {
    const request = buildValidRequest();

    expect(
      validateClassification(
        {
          intent: "report",
          areaId: "dhanmondi",
          reportKind: null,
          language: "en",
        },
        request,
      ),
    ).toBeNull();
  });

  test("never guesses areaId from selectedAreaId", () => {
    const request = buildValidRequest();

    expect(
      validateClassification(
        {
          intent: "question",
          reportKind: null,
          language: "en",
        },
        request,
      ),
    ).toBeNull();
  });
});
