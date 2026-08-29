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
import { useEffect, useMemo, useState } from "react";
import { BattiAssistant } from "./BattiAssistant";
import { ForecastSheet } from "./ForecastSheet";

const BattiMap = dynamic(() => import("./BattiMap"), { ssr: false });

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
  const [view, setView] = useState<"map" | "list">("map");
  const [sheet, setSheet] = useState<"closed" | "spin" | "ready">("closed");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantForecast, setAssistantForecast] =
    useState<AssistantForecast | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const [reportFlash, setReportFlash] = useState<string | null>(null);
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

  function openForecast(id: AreaId) {
    if (assistantOpen) setAssistantOpen(false);
    setSelectedId(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSheet("ready");
      return;
    }
    setSheet("spin");
    window.setTimeout(() => setSheet("ready"), 1500);
  }

  function openAssistantFromForecast(areaId: AreaId) {
    setSelectedId(areaId);
    setAssistantForecast({
      areaId,
      ...forecastForArea(seed, areaId, now ?? new Date()),
    });
    setSheet("closed");
    setAssistantOpen(true);
  }

  function setLocaleChoice(next: Locale) {
    setLocale(next);
  }

  if (!now) {
    return (
      <div className="app">
        <header className="top">
          <div>
            <p className="brand">{copy.brand}</p>
            <p className="tag">{copy.dhaka}</p>
          </div>
          <span className="live-stamp">{copy.samplePattern}</span>
        </header>
      </div>
    );
  }

  return (
    <div className={`app locale-${locale}`}>
      <header className="top">
        <div className="brand-block">
          <p className="brand">{copy.brand}</p>
          <p className="tag">
            <time dateTime={now.toISOString()}>{formatDhakaClock(now)}</time>
            {" · "}
            {copy.dhaka}
          </p>
        </div>
        <div className="top-meta">
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
          <span className="live-stamp">{copy.samplePattern}</span>
        </div>
      </header>

      <section className="route-card" aria-live="polite">
        <div className="route-stop">
          <span className="route-label">{selectedLabel}</span>
          <strong className={`status-${status}`}>{copy.status[status]}</strong>
        </div>
        <div className="route-line" aria-hidden="true" />
        <div className="route-stop">
          <span className="route-label">Eta</span>
          <em>
            {selectedEta ? formatEtaLocalized(selectedEta, locale) : "—"}
          </em>
        </div>
        <div className="route-line" aria-hidden="true" />
        <div className="route-stop">
          <span className="route-label">Report</span>
          <em>{copy.powerOn} / {copy.powerOff}</em>
        </div>
      </section>

      <div className="board">
        <div className="board-main">
          <div className="toolbar" role="tablist" aria-label="View">
            <button
              type="button"
              role="tab"
              aria-selected={view === "map"}
              className={view === "map" ? "on" : ""}
              onClick={() => setView("map")}
            >
              {copy.map}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              className={view === "list" ? "on" : ""}
              onClick={() => setView("list")}
            >
              {copy.list}
            </button>
            <button type="button" onClick={() => openForecast(selectedId)}>
              {copy.forecast}
            </button>
          </div>

          <main className="stage">
            {view === "map" ? (
              <BattiMap
                areas={AREAS}
                labels={copy.areas}
                statusByArea={statusByArea}
                etaByArea={etaByArea}
                selectedId={selectedId}
                onSelect={(id) => openForecast(id)}
                center={[selected.lat, selected.lng]}
                locale={locale}
              />
            ) : (
              <ul className="area-list">
                {AREAS.map((area) => (
                  <li key={area.id}>
                    <button
                      type="button"
                      className={area.id === selectedId ? "selected" : ""}
                      onClick={() => openForecast(area.id)}
                    >
                      <span>{copy.areas[area.id]}</span>
                      <em className={`status-${statusByArea[area.id]}`}>
                        {copy.status[statusByArea[area.id] ?? "stale"]}
                        {etaByArea[area.id]
                          ? ` · ${formatEtaLocalized(etaByArea[area.id], locale)}`
                          : ""}
                      </em>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </main>
        </div>

        <footer className="dock">
          <p className="dock-hint">{copy.dockHint(selectedLabel)}</p>
          <div className="taps">
            <button
              type="button"
              className="tap on"
              onClick={() => submitReport(selectedId, "on")}
            >
              {copy.powerOn}
            </button>
            <button
              type="button"
              className="tap off"
              onClick={() => submitReport(selectedId, "off")}
            >
              {copy.powerOff}
            </button>
            <button
              type="button"
              className="tap unsure"
              onClick={() => submitReport(selectedId, "unsure")}
            >
              {copy.unsure}
            </button>
          </div>
          <p className="report-flash" aria-live="polite">
            {reportFlash ?? "\u00a0"}
          </p>
        </footer>
      </div>

      <BattiAssistant
        open={assistantOpen}
        onOpenChange={(open) => {
          if (open) setSheet("closed");
          setAssistantOpen(open);
          if (!open) setAssistantForecast(null);
        }}
        selectedAreaId={selectedId}
        areas={assistantAreas}
        forecast={assistantForecast}
        onConfirmReport={submitReport}
        locale={locale}
        copy={copy}
      />

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
          onClose={() => setSheet("closed")}
          onAskBatti={openAssistantFromForecast}
        />
      ) : null}
    </div>
  );
}
