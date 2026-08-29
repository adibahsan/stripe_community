"use client";

import type { Status } from "@/lib/types";
import type { Area } from "@/lib/areas";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useEffect } from "react";

const STATUS_COLOR: Record<Status, string> = {
  on: "#3d9b6a",
  off: "#c23b2a",
  stale: "#8a8478",
};

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 0.6 });
  }, [lat, lng, map]);
  return null;
}

export default function BattiMap({
  areas,
  statusByArea,
  selectedId,
  onSelect,
  center,
}: {
  areas: readonly Area[];
  statusByArea: Record<string, Status>;
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
        attribution='&copy; OpenStreetMap'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={center[0]} lng={center[1]} />
      {areas.map((area) => {
        const status = statusByArea[area.id] ?? "stale";
        const selected = area.id === selectedId;
        return (
          <CircleMarker
            key={area.id}
            center={[area.lat, area.lng]}
            radius={selected ? 16 : 11}
            pathOptions={{
              color: selected ? "#e8a317" : STATUS_COLOR[status],
              fillColor: STATUS_COLOR[status],
              fillOpacity: 0.85,
              weight: selected ? 3 : 1,
            }}
            eventHandlers={{
              click: () => onSelect(area.id),
            }}
          >
            <Tooltip direction="top">{area.name}</Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
