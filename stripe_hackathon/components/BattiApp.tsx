"use client";

import { AREAS, DHAKA_CENTER } from "@/lib/areas";
import { loadCrowdReports, saveCrowdReports } from "@/lib/crowd-storage";
import { forecastForArea } from "@/lib/forecast";
import { buildSeed } from "@/lib/seed";
import { statusForArea } from "@/lib/status";
import type { AreaId, Report, Status } from "@/lib/types";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ForecastSheet } from "./ForecastSheet";

const BattiMap = dynamic(() => import("./BattiMap"), { ssr: false });

function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function BattiApp() {
  const now = useNow();
  const seed = useMemo(() => buildSeed(new Date()), []);
  const [crowd, setCrowd] = useState<Report[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState<AreaId>("dhanmondi");
  const [view, setView] = useState<"map" | "list">("map");
  const [sheet, setSheet] = useState<"closed" | "spin" | "ready">("closed");

  useEffect(() => {
    setCrowd(loadCrowdReports());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCrowdReports(crowd);
  }, [crowd, hydrated]);

  const reports = useMemo(() => [...seed, ...crowd], [seed, crowd]);
  const selected = AREAS.find((area) => area.id === selectedId) ?? AREAS[0];
  const status = statusForArea(reports, now, selectedId);
  const forecast = forecastForArea(seed, selectedId, now);

  const statusByArea = useMemo(() => {
    const map: Record<string, Status> = {};
    for (const area of AREAS) {
      map[area.id] = statusForArea(reports, now, area.id);
    }
    return map;
  }, [reports, now]);

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
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setSheet("ready");
      return;
    }
    setSheet("spin");
    window.setTimeout(() => setSheet("ready"), 1500);
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <p className="brand">Batti</p>
          <p className="tag">Crowd board for Dhaka cuts · not live DESCO</p>
        </div>
        <div className={`pill status-${status}`}>
          <span>{selected.name}</span>
          <strong>{status}</strong>
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
