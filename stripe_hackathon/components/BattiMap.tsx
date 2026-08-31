"use client";

import type { Area } from "@/lib/areas";
import { DHAKA_OUTLINE } from "@/lib/area-polygons";
import { formatEtaLocalized, type Locale } from "@/lib/i18n";
import type { Eta, Status } from "@/lib/types";
import { useEffect, useRef } from "react";
import type { Path } from "leaflet";
import {
  CircleMarker,
  LayerGroup,
  MapContainer,
  Polygon,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";

const STATUS_COLOR: Record<Status, string> = {
  on: "#1f8f5f",
  off: "#c23b2a",
  stale: "#8a8478",
};

function FitDhaka() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(DHAKA_OUTLINE as [number, number][], {
      padding: [24, 24],
      maxZoom: 12,
    });
  }, [map]);
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const skipFirst = useRef(true);
  useEffect(() => {
    // Initial view comes from FitDhaka; only fly on later Area changes.
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      map.setView([lat, lng], map.getZoom());
      return;
    }
    map.flyTo([lat, lng], map.getZoom(), { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

function haloOptions(status: Status, selected: boolean) {
  if (status === "off") {
    return {
      className: "halo-off",
      color: "#6b2a22",
      fillColor: "#0a0706",
      fillOpacity: 0.72,
      weight: selected ? 2 : 1.5,
      opacity: 0.7,
    };
  }
  if (status === "on") {
    return {
      className: "halo-on",
      color: "#e8a317",
      fillColor: "#1f8f5f",
      fillOpacity: 0.28,
      weight: selected ? 2.5 : 1.5,
      opacity: 0.95,
    };
  }
  return {
    className: "halo-stale",
    color: "#8a8478",
    fillColor: "#8a8478",
    fillOpacity: 0.2,
    weight: selected ? 2 : 1,
    opacity: 0.5,
  };
}

function AreaHalo({
  area,
  status,
  selected,
  onSelect,
}: {
  area: Area;
  status: Status;
  selected: boolean;
  onSelect: () => void;
}) {
  const pathRef = useRef<Path | null>(null);
  useEffect(() => {
    if (selected) pathRef.current?.bringToFront();
  }, [selected]);

  return (
    <Polygon
      ref={pathRef as never}
      positions={area.polygon}
      pathOptions={haloOptions(status, selected)}
      eventHandlers={{ click: onSelect }}
    />
  );
}

export default function BattiMap({
  areas,
  labels,
  statusByArea,
  etaByArea,
  selectedId,
  onSelect,
  center,
  locale,
}: {
  areas: readonly Area[];
  labels: Record<string, string>;
  statusByArea: Record<string, Status>;
  etaByArea: Record<string, Eta>;
  selectedId: string;
  onSelect: (id: Area["id"]) => void;
  center: [number, number];
  locale: Locale;
}) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="batti-map"
      attributionControl
      aria-label="Dhaka Areas map"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitDhaka />
      <Recenter lat={center[0]} lng={center[1]} />
      {areas.map((area) => {
        const status = statusByArea[area.id] ?? "stale";
        const eta = etaByArea[area.id];
        const selected = area.id === selectedId;
        const select = () => onSelect(area.id);
        const name = labels[area.id] ?? area.name;
        return (
          <LayerGroup key={area.id}>
            <AreaHalo
              area={area}
              status={status}
              selected={selected}
              onSelect={select}
            />
            <CircleMarker
              center={[area.lat, area.lng]}
              radius={selected ? 16 : 11}
              pathOptions={{
                color: selected ? "#e8a317" : STATUS_COLOR[status],
                fillColor: STATUS_COLOR[status],
                fillOpacity: 0.92,
                weight: selected ? 3 : 1,
              }}
              eventHandlers={{ click: select }}
            >
              <Tooltip
                // Leaflet freezes `permanent` when the tooltip is constructed,
                // so remount on selection change to move the pinned label.
                key={selected ? "pinned" : "hover"}
                direction="top"
                permanent={selected}
                className="batti-tip"
              >
                <span className="tip-name">{name}</span>
                {eta ? (
                  <span className="tip-eta">
                    {formatEtaLocalized(eta, locale)}
                  </span>
                ) : null}
              </Tooltip>
            </CircleMarker>
          </LayerGroup>
        );
      })}
    </MapContainer>
  );
}
