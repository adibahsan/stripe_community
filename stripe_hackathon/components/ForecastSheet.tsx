"use client";

import { adviceForArea } from "@/lib/advice";
import type { Area } from "@/lib/areas";
import type { Locale, Messages } from "@/lib/i18n";
import type { AreaId, Forecast, Report, Status } from "@/lib/types";
import { useEffect, useRef } from "react";
function HourStrip({
  reports,
  areaId,
  now,
  label,
}: {
  reports: readonly Report[];
  areaId: Area["id"];
  now: Date;
  label: string;
}) {
  const buckets = [5, 4, 3, 2, 1, 0].map((hoursAgo) => {
    const start = now.getTime() - (hoursAgo + 1) * 60 * 60_000;
    const end = now.getTime() - hoursAgo * 60 * 60_000;
    const slice = reports.filter((report) => {
      const t = Date.parse(report.at);
      return report.areaId === areaId && t >= start && t < end;
    });
    const off = slice.filter((r) => r.kind === "off").length;
    const on = slice.filter((r) => r.kind === "on").length;
    const total = off + on;
    const offRatio = total === 0 ? 0 : off / total;
    return { hoursAgo, offRatio, total };
  });

  return (
    <div className="hour-strip" aria-label={label}>
      {buckets.map((bucket) => (
        <div key={bucket.hoursAgo} className="hour-col">
          <div className="hour-track">
            <div
              className="hour-fill"
              style={{ height: `${Math.max(8, bucket.offRatio * 100)}%` }}
            />
          </div>
          <span>−{bucket.hoursAgo + 1}h</span>
        </div>
      ))}
    </div>
  );
}

export function ForecastSheet({
  area,
  areaLabel,
  status,
  forecast,
  reports,
  now,
  phase,
  locale,
  copy,
  onClose,
  onAskBatti,
}: {
  area: Area;
  areaLabel: string;
  status: Status;
  forecast: Forecast;
  reports: readonly Report[];
  now: Date;
  phase: "spin" | "ready";
  locale: Locale;
  copy: Messages;
  onClose: () => void;
  onAskBatti: (areaId: AreaId) => void;
}) {
  const advice = adviceForArea(area.id, locale);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="sheet-close"
          onClick={onClose}
        >
          {copy.close}
        </button>
        {phase === "spin" ? (
          <div className="spin">
            <div className="spin-coil" aria-hidden />
            <p>{copy.runningForecast}</p>
            <p className="spin-sub">{copy.forecastSub}</p>
          </div>
        ) : (
          <>
            <p className="stamp">{copy.samplePattern}</p>
            <h2 id="sheet-title">{areaLabel}</h2>
            <p className="sheet-status">
              {copy.statusNow(copy.status[status])}
            </p>
            <p className="forecast-line">
              {copy.forecastLine(forecast.typicalRestoreMinutes)}
              {forecast.offCountAtHour > 0
                ? copy.forecastSeedNote(
                    forecast.offCountAtHour,
                    forecast.sampleHour,
                  )
                : ""}
              .
            </p>
            <HourStrip
              reports={reports}
              areaId={area.id}
              now={now}
              label={copy.hourStripLabel}
            />
            <h3>{advice.headline}</h3>
            <div className="advice-body">
              {advice.body.split("\n\n").map((para) => (
                <p key={para.slice(0, 24)}>{para}</p>
              ))}
            </div>
            <ol className="kit">
              {advice.kit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <button
              type="button"
              className="forecast-ask"
              onClick={() => onAskBatti(area.id)}
            >
              {copy.askBattiAboutThis}
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
