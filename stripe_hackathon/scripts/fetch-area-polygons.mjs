/**
 * One-shot: fetch OSM outlines for Batti Areas and write lib/area-polygons.ts.
 * Run: node scripts/fetch-area-polygons.mjs
 * App never calls Nominatim/Overpass at runtime.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../lib/area-polygons.ts");

const AREAS = [
  { id: "dhanmondi", query: "Dhanmondi, Dhaka, Bangladesh", lat: 23.7465, lng: 90.376 },
  { id: "gulshan", query: "Gulshan, Dhaka, Bangladesh", lat: 23.7925, lng: 90.4078 },
  { id: "banani", query: "Banani, Dhaka, Bangladesh", lat: 23.794, lng: 90.4043 },
  { id: "mirpur-10", query: "Mirpur 10, Dhaka, Bangladesh", lat: 23.8071, lng: 90.3686 },
  { id: "uttara", query: "Uttara, Dhaka, Bangladesh", lat: 23.8759, lng: 90.3795 },
  { id: "mohammadpur", query: "Mohammadpur, Dhaka, Bangladesh", lat: 23.7574, lng: 90.3615 },
  { id: "motijheel", query: "Motijheel, Dhaka, Bangladesh", lat: 23.7295, lng: 90.4172 },
  { id: "lalbagh", query: "Lalbagh, Dhaka, Bangladesh", lat: 23.719, lng: 90.3882 },
  { id: "bashundhara", query: "Bashundhara Residential Area, Dhaka, Bangladesh", lat: 23.8199, lng: 90.4526 },
  { id: "tejgaon", query: "Tejgaon, Dhaka, Bangladesh", lat: 23.7636, lng: 90.391 },
  { id: "badda", query: "Badda, Dhaka, Bangladesh", lat: 23.7806, lng: 90.4266 },
  { id: "wari", query: "Wari, Dhaka, Bangladesh", lat: 23.7166, lng: 90.4258 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nominatim(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: query,
      format: "json",
      polygon_geojson: "1",
      limit: "5",
      addressdetails: "0",
    });
  const res = await fetch(url, {
    headers: {
      "User-Agent": "BattiStripeHackathon/1.0 (local polygon bake)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status} for ${query}`);
  return res.json();
}

function ringFromGeoJson(geojson) {
  if (!geojson) return null;
  if (geojson.type === "Polygon") {
    return geojson.coordinates[0].map(([lng, lat]) => [lat, lng]);
  }
  if (geojson.type === "MultiPolygon") {
    // largest outer ring
    let best = null;
    let bestArea = -1;
    for (const poly of geojson.coordinates) {
      const ring = poly[0];
      const a = Math.abs(ringAreaLngLat(ring));
      if (a > bestArea) {
        bestArea = a;
        best = ring.map(([lng, lat]) => [lat, lng]);
      }
    }
    return best;
  }
  return null;
}

function ringAreaLngLat(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return a / 2;
}

function ringAreaLatLng(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][1] * ring[i + 1][0] - ring[i + 1][1] * ring[i][0];
  }
  return a / 2;
}

/** Douglas-Peucker-ish: keep every Nth after distance filter, cap vertices. */
function simplify(ring, maxPoints = 40) {
  if (ring.length <= maxPoints) return closeRing(ring);
  const closed =
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
      ? ring.slice(0, -1)
      : ring;

  // Adaptive stride
  const stride = Math.ceil(closed.length / (maxPoints - 1));
  const out = [];
  for (let i = 0; i < closed.length; i += stride) out.push(closed[i]);
  if (out.length < 4) {
    // densify from original
    return closeRing(closed.filter((_, i) => i % Math.max(1, Math.floor(closed.length / 12)) === 0).slice(0, 36));
  }
  return closeRing(out.slice(0, maxPoints - 1));
}

function closeRing(ring) {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, [first[0], first[1]]];
}

/**
 * Road-ish irregular ring from Nominatim bounding box (not a circle).
 * Uses 16 vertices with slight radial jitter so shapes look neighborhood-like.
 */
function ringFromBBox(bbox, lat, lng, verts = 16) {
  // bbox: [south, north, west, east] as strings from Nominatim
  const south = Number(bbox[0]);
  const north = Number(bbox[1]);
  const west = Number(bbox[2]);
  const east = Number(bbox[3]);
  const halfH = (north - south) / 2;
  const halfW = (east - west) / 2;
  // Shrink default Nominatim node bbox (~2km) for dense neighborhoods
  const rh = Math.min(halfH, 0.012) * 0.85;
  const rw = Math.min(halfW, 0.014) * 0.85;
  const ring = [];
  for (let i = 0; i < verts; i++) {
    const t = (i / verts) * Math.PI * 2;
    // Squircle + mild wobble (deterministic from id angle)
    const wobble = 0.88 + 0.12 * Math.sin(t * 3 + lat * 10);
    const x = Math.cos(t);
    const y = Math.sin(t);
    const n = Math.max(Math.abs(x), Math.abs(y));
    const sx = (x / n) * wobble;
    const sy = (y / n) * wobble;
    ring.push([+(lat + sy * rh).toFixed(5), +(lng + sx * rw).toFixed(5)]);
  }
  return closeRing(ring);
}

/** Tighter pocket for Mirpur-10 circle area (~800m). */
function mirpur10Ring(lat, lng) {
  const rh = 0.0065;
  const rw = 0.007;
  const verts = 20;
  const ring = [];
  for (let i = 0; i < verts; i++) {
    const t = (i / verts) * Math.PI * 2;
    const wobble = 0.92 + 0.08 * Math.cos(t * 2);
    ring.push([
      +(lat + Math.sin(t) * rh * wobble).toFixed(5),
      +(lng + Math.cos(t) * rw * wobble).toFixed(5),
    ]);
  }
  return closeRing(ring);
}

function pickBestResult(results, lat, lng) {
  // Prefer Polygon/MultiPolygon near centroid
  const scored = results.map((r) => {
    const gj = r.geojson;
    const isPoly = gj && (gj.type === "Polygon" || gj.type === "MultiPolygon");
    const dlat = Number(r.lat) - lat;
    const dlng = Number(r.lon) - lng;
    const dist = dlat * dlat + dlng * dlng;
    const rank = Number(r.place_rank) || 99;
    // suburb/neighbourhood preferred
    const typeBonus =
      r.type === "suburb" || r.type === "neighbourhood" || r.type === "quarter"
        ? 0
        : r.class === "place"
          ? 1
          : 5;
    return { r, isPoly, dist, score: (isPoly ? 0 : 100) + typeBonus * 10 + dist * 1000 + rank * 0.01 };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.r ?? null;
}

function ringCentroid(ring) {
  let lat = 0;
  let lng = 0;
  const n = ring.length - 1; // closed
  for (let i = 0; i < n; i++) {
    lat += ring[i][0];
    lng += ring[i][1];
  }
  return [lat / n, lng / n];
}

function defaultBBox(area) {
  return [
    String(area.lat - 0.011),
    String(area.lat + 0.011),
    String(area.lng - 0.013),
    String(area.lng + 0.013),
  ];
}

function isUsableRing(ring, area) {
  if (!ring || ring.length < 4) return false;
  const areaAbs = Math.abs(ringAreaLatLng(ring));
  // Too big (whole city) or too small (building footprint)
  if (areaAbs > 0.008 || areaAbs < 0.00002) return false;
  const [clat, clng] = ringCentroid(ring);
  const dlat = clat - area.lat;
  const dlng = clng - area.lng;
  // Must sit near the Area centroid (~2.5 km)
  if (dlat * dlat + dlng * dlng > 0.0009) return false;
  return true;
}

async function buildArea(area) {
  await sleep(1100); // Nominatim rate limit
  const results = await nominatim(area.query);
  const best = pickBestResult(results, area.lat, area.lng);
  let source = "bbox-fallback";
  let ring = null;

  if (area.id === "mirpur-10") {
    // Circle-roundabout pocket, not all of Mirpur
    ring = mirpur10Ring(area.lat, area.lng);
    source = "mirpur-10-pocket";
  } else if (best) {
    const osmRing = ringFromGeoJson(best.geojson);
    if (osmRing && isUsableRing(simplify(osmRing, 40), area)) {
      ring = simplify(osmRing, 40);
      source = `osm:${best.osm_type}/${best.osm_id}`;
    } else {
      ring = ringFromBBox(best.boundingbox ?? defaultBBox(area), area.lat, area.lng);
      source = `bbox:${best.osm_type}/${best.osm_id}`;
      if (!isUsableRing(ring, area)) {
        ring = ringFromBBox(defaultBBox(area), area.lat, area.lng);
        source = "bbox-local";
      }
    }
  } else {
    ring = ringFromBBox(defaultBBox(area), area.lat, area.lng);
  }

  if (!isUsableRing(ring, area)) {
    console.warn(`  ${area.id}: fallback ring still bad, forcing local bbox`);
    ring = ringFromBBox(defaultBBox(area), area.lat, area.lng);
    source = "bbox-forced";
  }

  console.log(`  ${area.id}: ${source}, ${ring.length} verts`);
  return { id: area.id, source, polygon: ring };
}

const header = `/**
 * Static neighborhood outlines for Batti Areas.
 * Generated by scripts/fetch-area-polygons.mjs from OpenStreetMap (ODbL).
 * Not DESCO feeder boundaries. Do not fetch OSM at runtime — regenerate this file.
 */
import type { AreaId } from "./types";

export type LatLng = [number, number];

export const AREA_POLYGONS: Record<AreaId, LatLng[]> = {
`;

async function main() {
  console.log("Fetching OSM polygons…");
  const entries = [];
  for (const area of AREAS) {
    entries.push(await buildArea(area));
  }

  let body = header;
  for (const e of entries) {
    body += `  "${e.id}": ${JSON.stringify(e.polygon)}, // ${e.source}\n`;
  }
  body += `};\n`;

  writeFileSync(OUT, body);
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
