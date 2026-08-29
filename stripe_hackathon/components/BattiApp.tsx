"use client";

import { AREAS } from "@/lib/areas";
import { buildAssistantAreas } from "@/lib/assistant";
import type { AssistantForecast } from "@/lib/assistant";
import { loadCrowdReports, saveCrowdReports } from "@/lib/crowd-storage";
import { curveForMonth } from "@/lib/curves";
import { dhakaMonth, formatDhakaClock } from "@/lib/dhaka-time";
import { etaForArea } from "@/lib/eta";
import { forecastForArea } from "@/lib/forecast";
import {
  formatEtaLocalized,
  loadLocale,
  messagesFor,
  saveLocale,
  type Locale,
} from "@/lib/i18n";
import { buildSeed } from "@/lib/seed";
import { statusForArea } from "@/lib/status";
import type { AreaId, Eta, Report, ReportKind, Status } from "@/lib/types";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { BattiAssistant } from "./BattiAssistant";
import { FloatingReportControl } from "./FloatingReportControl";
import { ForecastSheet } from "./ForecastSheet";

const BattiMap = dynamic(() => import("./BattiMap"), { ssr: false });

type ForecastPhase = "closed" | "spin" | "ready";

function useNow(intervalMs = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function BattiApp() {
  const now = useNow();
  const [crowd, setCrowd] = useState<Report[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<AreaId>("dhanmondi");
  const [listOpen, setListOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [sheet, setSheet] = useState<ForecastPhase>("closed");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantForecast, setAssistantForecast] =
    useState<AssistantForecast | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [reportFlash, setReportFlash] = useState<string | null>(null);
  const listTriggerRef = useRef<HTMLButtonElement>(null);
  const listCloseRef = useRef<HTMLButtonElement>(null);
  const forecastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const forecastTimerRef = useRef<number | null>(null);
  const copy = messagesFor(locale);

  useEffect(() => {
    setCrowd(loadCrowdReports());
    setLocale(loadLocale());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCrowdReports(crowd);
  }, [crowd, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveLocale(locale);
    document.documentElement.lang = locale === "bn" ? "bn" : "en";
  }, [locale, hydrated]);

  useEffect(() => {
    if (!listOpen) return;
    window.requestAnimationFrame(() => listCloseRef.current?.focus());
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeList(true);
      if (event.key !== "Tab") return;
      const buttons = listCloseRef.current
        ?.closest('[role="dialog"]')
        ?.querySelectorAll<HTMLButtonElement>("button");
      const first = buttons?.[0];
      const last = buttons?.[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listOpen]);

  useEffect(
    () => () => {
      if (forecastTimerRef.current !== null) {
        window.clearTimeout(forecastTimerRef.current);
      }
    },
    [],
  );

  const seed = useMemo(() => (now ? buildSeed(now) : []), [now]);
  const reports = useMemo(() => [...seed, ...crowd], [seed, crowd]);
  const month = now ? dhakaMonth(now) : 1;

  const statusByArea = useMemo(() => {
    const map: Record<string, Status> = {};
    if (!now) return map;
    for (const area of AREAS) {
      map[area.id] = statusForArea(reports, now, area.id);
    }
    return map;
  }, [reports, now]);

  const etaByArea = useMemo(() => {
    const map: Record<string, Eta> = {};
    if (!now) return map;
    AREAS.forEach((area, areaIndex) => {
      map[area.id] = etaForArea(
        curveForMonth(month, areaIndex),
        now,
        statusByArea[area.id] ?? "stale",
      );
    });
    return map;
  }, [month, now, statusByArea]);

  const assistantAreas = useMemo(
    () =>
      now
        ? buildAssistantAreas({ now, crowd, statusByArea, etaByArea })
        : [],
    [now, crowd, statusByArea, etaByArea],
  );

  const selected = AREAS.find((area) => area.id === selectedId) ?? AREAS[0];
  const selectedLabel = copy.areas[selectedId] ?? selected.name;
  const status = now ? statusForArea(reports, now, selectedId) : "stale";
  const forecast = now
    ? forecastForArea(seed, selectedId, now)
    : { typicalRestoreMinutes: 45, sampleHour: 0, offCountAtHour: 0 };
  const selectedEta = etaByArea[selectedId];

  function submitReport(areaId: AreaId, kind: ReportKind) {
    setSelectedId(areaId);
    setCrowd((previous) => [
      ...previous,
      { areaId, kind, at: new Date().toISOString() },
    ]);
    const label = copy.areas[areaId] ?? areaId;
    setReportFlash(copy.reportSaved(copy.kind[kind], label));
    window.setTimeout(() => setReportFlash(null), 2200);
  }

  function cancelForecastTimer() {
    if (forecastTimerRef.current !== null) {
      window.clearTimeout(forecastTimerRef.current);
      forecastTimerRef.current = null;
    }
  }

  function selectArea(id: AreaId) {
    setSelectedId(id);
  }

  function openList() {
    cancelForecastTimer();
    setSheet("closed");
    setAssistantOpen(false);
    setReportOpen(false);
    setListOpen(true);
  }

  function closeList(restoreFocus = true) {
    setListOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => listTriggerRef.current?.focus());
    }
  }

  function closeForecast(restoreFocus = true) {
    cancelForecastTimer();
    setSheet("closed");
    if (restoreFocus) {
      window.requestAnimationFrame(() => forecastTriggerRef.current?.focus());
    }
  }

  function openForecast(id: AreaId, trigger: HTMLButtonElement) {
    forecastTriggerRef.current = trigger;
    setSelectedId(id);
    setListOpen(false);
    setAssistantOpen(false);
    setReportOpen(false);
    cancelForecastTimer();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSheet("ready");
    } else {
      setSheet("spin");
      forecastTimerRef.current = window.setTimeout(() => {
        forecastTimerRef.current = null;
        setSheet("ready");
      }, 1500);
    }
  }

  function setAssistantVisibility(open: boolean) {
    if (open) {
      cancelForecastTimer();
      setListOpen(false);
      setSheet("closed");
      setReportOpen(false);
    }
    setAssistantOpen(open);
    if (!open) setAssistantForecast(null);
  }

  function openAssistantFromForecast(areaId: AreaId) {
    setSelectedId(areaId);
    setAssistantForecast({
      areaId,
      ...forecastForArea(seed, areaId, now ?? new Date()),
    });
    closeForecast(false);
    setAssistantVisibility(true);
  }

  function setLocaleChoice(next: Locale) {
    setLocale(next);
  }

  if (!now) {
    return (
      <div className="app">
        <main className="map-shell map-loading" aria-busy="true">
          <div className="brand-pill">
            <p className="brand">{copy.brand}</p>
            <p className="tag">{copy.dhaka}</p>
            <span className="live-stamp">{copy.samplePattern}</span>
          </div>
          <div aria-hidden="true" />
        </main>
      </div>
    );
  }

  return (
    <div className={`app locale-${locale}`}>
      <main className="map-shell">
        <BattiMap
          areas={AREAS}
          labels={copy.areas}
          statusByArea={statusByArea}
          etaByArea={etaByArea}
          selectedId={selectedId}
          onSelect={selectArea}
          center={[selected.lat, selected.lng]}
          locale={locale}
        />
      </main>

      <div className="floating-layer">
        <div className="brand-pill">
          <p className="brand">{copy.brand}</p>
          <p className="tag">
            <time dateTime={now.toISOString()}>{formatDhakaClock(now)}</time>
            {" · "}
            {copy.dhaka}
          </p>
          <span className="live-stamp">{copy.samplePattern}</span>
        </div>

        <div className="top-controls">
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              type="button"
              className={locale === "en" ? "on" : ""}
              onClick={() => setLocaleChoice("en")}
            >
              {copy.languageEn}
            </button>
            <button
              type="button"
              className={locale === "bn" ? "on" : ""}
              onClick={() => setLocaleChoice("bn")}
            >
              {copy.languageBn}
            </button>
          </div>
          <button
            ref={listTriggerRef}
            type="button"
            className="bubble"
            onClick={openList}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14M5 12h14M5 17h14" />
            </svg>
            <span className="bubble-label">{copy.list}</span>
          </button>
          <button
            type="button"
            className="bubble"
            onClick={(event) => openForecast(selectedId, event.currentTarget)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 17l5-5 4 3 7-8" />
            </svg>
            <span className="bubble-label">{copy.forecast}</span>
          </button>
        </div>

        <button
          type="button"
          className="status-chip"
          aria-label={`${copy.forecast} ${selectedLabel}`}
          onClick={(event) => openForecast(selectedId, event.currentTarget)}
        >
          <span>{selectedLabel}</span>
          <strong className={`status-${status}`}>{copy.status[status]}</strong>
          <em>
            {copy.eta}:{" "}
            {selectedEta ? formatEtaLocalized(selectedEta, locale) : "—"}
          </em>
        </button>

        <div className="action-cluster">
          <FloatingReportControl
            open={reportOpen}
            onOpenChange={(open) => {
              if (open) {
                cancelForecastTimer();
                setListOpen(false);
                setSheet("closed");
                setAssistantOpen(false);
              }
              setReportOpen(open);
            }}
            onSubmit={(kind) => submitReport(selectedId, kind)}
            copy={copy}
          />
          <BattiAssistant
            open={assistantOpen}
            onOpenChange={setAssistantVisibility}
            selectedAreaId={selectedId}
            areas={assistantAreas}
            forecast={assistantForecast}
            onConfirmReport={submitReport}
            locale={locale}
            copy={copy}
          />
          <p className="report-flash" aria-live="polite">
            {reportFlash ?? "\u00a0"}
          </p>
        </div>
      </div>

      {listOpen ? (
        <div
          className="sheet-backdrop list-backdrop"
          role="presentation"
          onClick={() => closeList(true)}
        >
          <aside
            className="sheet list-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={copy.list}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={listCloseRef}
              type="button"
              className="sheet-close"
              onClick={() => closeList(true)}
            >
              {copy.close}
            </button>
            <ul className="area-list">
              {AREAS.map((area) => (
                <li key={area.id}>
                  <button
                    type="button"
                    className={area.id === selectedId ? "selected" : ""}
                    onClick={() => {
                      selectArea(area.id);
                      closeList(true);
                    }}
                  >
                    <span>{copy.areas[area.id]}</span>
                    <em className={`status-${statusByArea[area.id]}`}>
                      {copy.status[statusByArea[area.id] ?? "stale"]}
                      {" · "}
                      {copy.eta}:{" "}
                      {etaByArea[area.id]
                        ? formatEtaLocalized(etaByArea[area.id], locale)
                        : "—"}
                    </em>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}

      {sheet !== "closed" ? (
        <ForecastSheet
          area={selected}
          areaLabel={selectedLabel}
          status={status}
          forecast={forecast}
          reports={reports}
          now={now}
          phase={sheet}
          locale={locale}
          copy={copy}
          onClose={() => closeForecast(true)}
          onAskBatti={openAssistantFromForecast}
        />
      ) : null}
    </div>
  );
}
