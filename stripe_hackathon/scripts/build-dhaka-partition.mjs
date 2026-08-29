/**
 * Build non-overlapping Area polygons that tile Dhaka metro.
 * Clipped Voronoi around Area centroids → lib/area-polygons.ts
 * Run: node scripts/build-dhaka-partition.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../lib/area-polygons.ts");

/** Sites nudged so Banani sits north of Gulshan and cells tile fairly. */
const SITES = [
  { id: "dhanmondi", lat: 23.7465, lng: 90.376 },
  { id: "gulshan", lat: 23.7925, lng: 90.412 },
  { id: "banani", lat: 23.794, lng: 90.4043 }, // will nudge below
  { id: "mirpur-10", lat: 23.8071, lng: 90.3686 },
  { id: "uttara", lat: 23.8759, lng: 90.3795 },
  { id: "mohammadpur", lat: 23.7574, lng: 90.3615 },
  { id: "motijheel", lat: 23.7295, lng: 90.4172 },
  { id: "lalbagh", lat: 23.719, lng: 90.3882 },
  { id: "bashundhara", lat: 23.8199, lng: 90.4526 },
  { id: "tejgaon", lat: 23.7636, lng: 90.391 },
  { id: "badda", lat: 23.7806, lng: 90.4266 },
  { id: "wari", lat: 23.7166, lng: 90.4258 },
];

// Banani north of Gulshan so Voronoi does not collapse into a thin sliver
SITES.find((s) => s.id === "banani").lat = 23.7995;
SITES.find((s) => s.id === "banani").lng = 90.4035;
SITES.find((s) => s.id === "gulshan").lat = 23.7905;
SITES.find((s) => s.id === "gulshan").lng = 90.414;

/**
 * Dhaka metro outline (Leaflet [lat,lng], closed).
 * Covers DNCC/DSCC urban core from Uttara through Old Dhaka to east Bashundhara.
 */
const DHAKA = [
  [23.91, 90.34],
  [23.91, 90.43],
  [23.89, 90.49],
  [23.84, 90.51],
  [23.78, 90.52],
  [23.72, 90.51],
  [23.69, 90.48],
  [23.67, 90.42],
  [23.68, 90.35],
  [23.71, 90.31],
  [23.76, 90.30],
  [23.82, 90.305],
  [23.87, 90.32],
  [23.91, 90.34],
];

function dist2(a, b) {
  const dlat = a.lat - b.lat;
  const dlng = a.lng - b.lng;
  return dlat * dlat + dlng * dlng;
}

/** Clip subject ring to half-plane of points closer to site than other (Sutherland–Hodgman). */
function clipCloserTo(ring, site, other) {
  const out = [];
  const inside = (p) =>
    dist2({ lat: p[0], lng: p[1] }, site) <= dist2({ lat: p[0], lng: p[1] }, other);

  // Intersection of edge AB with perpendicular bisector of site–other
  const intersect = (a, b) => {
    // Solve for t where dist2(lerp(a,b,t), site) == dist2(lerp(a,b,t), other)
    // 2*(other-site)·p = |other|^2 - |site|^2  in lat/lng plane
    const sx = site.lng;
    const sy = site.lat;
    const ox = other.lng;
    const oy = other.lat;
    const ax = a[1];
    const ay = a[0];
    const bx = b[1];
    const by = b[0];
    const dx = bx - ax;
    const dy = by - ay;
    const mx = ox - sx;
    const my = oy - sy;
    const rhs = (ox * ox + oy * oy - sx * sx - sy * sy) / 2;
    const denom = mx * dx + my * dy;
    if (Math.abs(denom) < 1e-18) return a; // parallel — keep a
    const t = (rhs - (mx * ax + my * ay)) / denom;
    return [ay + t * dy, ax + t * dx];
  };

  for (let i = 0; i < ring.length - 1; i++) {
    const cur = ring[i];
    const next = ring[i + 1];
    const curIn = inside(cur);
    const nextIn = inside(next);
    if (curIn && nextIn) {
      out.push(next);
    } else if (curIn && !nextIn) {
      out.push(intersect(cur, next));
    } else if (!curIn && nextIn) {
      out.push(intersect(cur, next));
      out.push(next);
    }
  }
  if (out.length === 0) return null;
  return closeRing(out);
}

function closeRing(ring) {
  if (ring.length === 0) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, [first[0], first[1]]];
}

function outRound(p) {
  return [+p[0].toFixed(5), +p[1].toFixed(5)];
}

function voronoiCell(site, sites) {
  let cell = DHAKA.map((p) => [...p]);
  for (const other of sites) {
    if (other.id === site.id) continue;
    cell = clipCloserTo(cell, site, other);
    if (!cell || cell.length < 4) return null;
  }
  return simplify(cell, 40);
}

function simplify(ring, maxPts = 36) {
  if (!ring || ring.length < 4) return null;
  const closed = closeRing(ring).map(outRound);
  if (closed.length <= maxPts) return closeRing(closed);
  const open = closed.slice(0, -1);
  const stride = Math.ceil(open.length / (maxPts - 1));
  const out = [];
  for (let i = 0; i < open.length; i += stride) out.push(open[i]);
  return closeRing(out.slice(0, maxPts - 1));
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    a += ring[i][1] * ring[i + 1][0] - ring[i + 1][1] * ring[i][0];
  }
  return Math.abs(a / 2);
}

function pointInRing(p, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i][0];
    const xi = ring[i][1];
    const yj = ring[j][0];
    const xj = ring[j][1];
    const intersect =
      yi > p[0] !== yj > p[0] &&
      p[1] < ((xj - xi) * (p[0] - yi)) / (yj - yi || 1e-15) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const polys = {};
for (const site of SITES) {
  const cell = voronoiCell(site, SITES);
  if (!cell) throw new Error(`empty cell for ${site.id}`);
  polys[site.id] = cell;
  console.log(`${site.id}: ${cell.length} verts, area=${ringArea(cell).toFixed(5)}`);
}

// Verify: no site inside another cell; grid coverage inside DHAKA
let covered = 0;
let total = 0;
for (let lat = 23.67; lat <= 23.91; lat += 0.008) {
  for (let lng = 90.30; lng <= 90.52; lng += 0.008) {
    if (!pointInRing([lat, lng], DHAKA)) continue;
    total++;
    const owners = SITES.filter((s) => pointInRing([lat, lng], polys[s.id]));
    if (owners.length === 1) covered++;
    if (owners.length > 1) console.warn("overlap at", lat, lng, owners.map((o) => o.id));
  }
}
console.log(`coverage (exclusive): ${covered}/${total} = ${((100 * covered) / total).toFixed(1)}%`);

const header = `/**
 * Static neighborhood outlines for Batti Areas.
 * Clipped Voronoi partition of Dhaka metro (scripts/build-dhaka-partition.mjs).
 * Non-overlapping; tiles the urban core. Not DESCO feeder boundaries.
 */
import type { AreaId } from "./types";

export type LatLng = [number, number];

/** Outer Dhaka metro ring used to clip Area cells (Leaflet [lat, lng]). */
export const DHAKA_OUTLINE: LatLng[] = ${JSON.stringify(DHAKA)};

export const AREA_POLYGONS: Record<AreaId, LatLng[]> = {
`;

let body = header;
for (const site of SITES) {
  body += `  "${site.id}": ${JSON.stringify(polys[site.id])},\n`;
}
body += `};\n`;

writeFileSync(OUT, body);
console.log(`Wrote ${OUT}`);

// Also emit nudged centroids for areas.ts sync
console.log("\nCentroids to use:");
for (const s of SITES) {
  console.log(`  ${s.id}: ${s.lat}, ${s.lng}`);
}
