"use client";

import { AREAS } from "@/lib/areas";
import { buildAssistantAreas } from "@/lib/assistant";
import { loadCrowdReports, saveCrowdReports } from "@/lib/crowd-storage";
import { curveForMonth } from "@/lib/curves";
import { dhakaMonth, formatDhakaClock } from "@/lib/dhaka-time";
import { etaForArea, formatEta } from "@/lib/eta";
import { forecastForArea } from "@/lib/forecast";
import { buildSeed } from "@/lib/seed";
import { statusForArea } from "@/lib/status";
import type { AreaId, Eta, Report, Status } from "@/lib/types";
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

  useEffect(() => {
    setCrowd(loadCrowdReports());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCrowdReports(crowd);
  }, [crowd, hydrated]);

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
  const status = now
    ? statusForArea(reports, now, selectedId)
    : "stale";
  const forecast = now
    ? forecastForArea(seed, selectedId, now)
    : { typicalRestoreMinutes: 45, sampleHour: 0, offCountAtHour: 0 };

  function tap(kind: Report["kind"]) {
    const next: Report = {
      areaId: selectedId,
      kind,
      at: new Date().toISOString(),
    };
    setCrowd((prev) => [...prev, next]);
  }

  function openForecast(id: AreaId) {
    setSelectedId(id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSheet("ready");
      return;
    }
    setSheet("spin");
    window.setTimeout(() => setSheet("ready"), 1500);
  }

  if (!now) {
    return (
      <div className="app">
        <header className="top">
          <div>
            <p className="brand">Batti</p>
            <p className="tag">Dhaka</p>
          </div>
          <span className="live-stamp">Sample pattern</span>
        </header>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="brand">Batti</p>
          <p className="tag">
            <time dateTime={now.toISOString()}>{formatDhakaClock(now)}</time>
            {" · Dhaka"}
          </p>
        </div>
        <div className="top-meta">
          <span className="live-stamp">Sample pattern</span>
          <div className={`pill status-${status}`}>
            <span>{selected.name}</span>
            <strong>{status}</strong>
            {etaByArea[selectedId] ? (
              <em>{formatEta(etaByArea[selectedId])}</em>
            ) : null}
          </div>
        </div>
      </header>

      <div className="toolbar">
        <button
          type="button"
          className={view === "map" ? "on" : ""}
          onClick={() => setView("map")}
        >
          Map
        </button>
        <button
          type="button"
          className={view === "list" ? "on" : ""}
          onClick={() => setView("list")}
        >
          List
        </button>
        <button type="button" onClick={() => openForecast(selectedId)}>
          Forecast
        </button>
      </div>

      <main className="stage">
        {view === "map" ? (
          <BattiMap
            areas={AREAS}
            statusByArea={statusByArea}
            etaByArea={etaByArea}
            selectedId={selectedId}
            onSelect={(id) => openForecast(id)}
            center={[selected.lat, selected.lng]}
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
                  <span>{area.name}</span>
                  <em className={`status-${statusByArea[area.id]}`}>
                    {statusByArea[area.id]}
                    {etaByArea[area.id]
                      ? ` · ${formatEta(etaByArea[area.id])}`
                      : ""}
                  </em>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="dock">
        <p className="dock-hint">
          Tap what you see in {selected.name}. Unsure does not vote.
        </p>
        <div className="taps">
          <button type="button" className="tap on" onClick={() => tap("on")}>
            Power on
          </button>
          <button type="button" className="tap off" onClick={() => tap("off")}>
            Power off
          </button>
          <button
            type="button"
            className="tap unsure"
            onClick={() => tap("unsure")}
          >
            Unsure
          </button>
        </div>
      </footer>

      <BattiAssistant
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        selectedAreaId={selectedId}
        areas={assistantAreas}
        forecast={null}
      />

      {sheet !== "closed" ? (
        <ForecastSheet
          area={selected}
          status={status}
          forecast={forecast}
          reports={reports}
          now={now}
          phase={sheet}
          onClose={() => setSheet("closed")}
        />
      ) : null}
    </div>
  );
}
