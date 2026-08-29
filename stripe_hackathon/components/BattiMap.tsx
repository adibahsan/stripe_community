"use client";

import type { Area } from "@/lib/areas";
import { formatEta } from "@/lib/eta";
import type { Eta, Status } from "@/lib/types";
import { useEffect } from "react";
import { Circle, CircleMarker, LayerGroup, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";

const STATUS_COLOR: Record<Status, string> = {
  on: "#3d9b6a",
  off: "#c23b2a",
  stale: "#8a8478",
};

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
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
      fillColor: "#3d9b6a",
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

export default function BattiMap({
  areas,
  statusByArea,
  etaByArea,
  selectedId,
  onSelect,
  center,
}: {
  areas: readonly Area[];
  statusByArea: Record<string, Status>;
  etaByArea: Record<string, Eta>;
  selectedId: string;
  onSelect: (id: Area["id"]) => void;
  center: [number, number];
}) {
  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="batti-map"
      attributionControl
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center[0]} lng={center[1]} />
      {areas.map((area) => {
        const status = statusByArea[area.id] ?? "stale";
        const eta = etaByArea[area.id];
        const selected = area.id === selectedId;
        const select = { click: () => onSelect(area.id) };
        return (
          <LayerGroup key={area.id}>
            <Circle
              center={[area.lat, area.lng]}
              radius={selected ? 2800 : 2000}
              pathOptions={haloOptions(status, selected)}
              eventHandlers={select}
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
              eventHandlers={select}
            >
              <Tooltip
                direction="top"
                permanent={selected}
                className="batti-tip"
              >
                <span className="tip-name">{area.name}</span>
                {eta ? <span className="tip-eta">{formatEta(eta)}</span> : null}
              </Tooltip>
            </CircleMarker>
          </LayerGroup>
        );
      })}
    </MapContainer>
  );
}
