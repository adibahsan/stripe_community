"use client";

import { adviceForArea } from "@/lib/advice";
import type { Area } from "@/lib/areas";
import type { Forecast, Report, Status } from "@/lib/types";

function HourStrip({
  reports,
  areaId,
  now,
}: {
  reports: readonly Report[];
  areaId: Area["id"];
  now: Date;
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
    <div className="hour-strip" aria-label="Last six hours, sample pattern">
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
  status,
  forecast,
  reports,
  now,
  phase,
  onClose,
}: {
  area: Area;
  status: Status;
  forecast: Forecast;
  reports: readonly Report[];
  now: Date;
  phase: "spin" | "ready";
  onClose: () => void;
}) {
  const advice = adviceForArea(area.id);

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="sheet"
        role="dialog"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="sheet-close" onClick={onClose}>
          Close
        </button>
        {phase === "spin" ? (
          <div className="spin">
            <div className="spin-coil" aria-hidden />
            <p>Running forecast…</p>
            <p className="spin-sub">Sample pattern, not a trained model</p>
          </div>
        ) : (
          <>
            <p className="stamp">Sample pattern</p>
            <h2 id="sheet-title">{area.name}</h2>
            <p className="sheet-status">
              Status now: <strong>{status}</strong>
            </p>
            <p className="forecast-line">
              At this hour this Area usually returns in about{" "}
              <strong>{forecast.typicalRestoreMinutes} min</strong>
              {forecast.offCountAtHour > 0
                ? ` · ${forecast.offCountAtHour} Off marks in the Seed at ${forecast.sampleHour}:00 Dhaka`
                : ""}
              .
            </p>
            <HourStrip reports={reports} areaId={area.id} now={now} />
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
          </>
        )}
      </aside>
    </div>
  );
}
