import { describe, expect, test } from "vitest";
import { AREA_POLYGONS, DHAKA_OUTLINE } from "./area-polygons";
import { AREAS } from "./areas";
import type { AreaId } from "./types";

const AREA_IDS = AREAS.map((a) => a.id);

function samePoint(a: [number, number], b: [number, number]) {
  return a[0] === b[0] && a[1] === b[1];
}

function pointInRing(p: [number, number], ring: [number, number][]) {
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

describe("AREA_POLYGONS catalog", () => {
  test("every AreaId has a closed ring with at least 4 vertices", () => {
    for (const id of AREA_IDS) {
      const ring = AREA_POLYGONS[id];
      expect(ring.length, id).toBeGreaterThanOrEqual(4);
      expect(samePoint(ring[0], ring[ring.length - 1]), id).toBe(true);
    }
  });

  test("AREAS polygons match the catalog and sit near their centroids", () => {
    for (const area of AREAS) {
      expect(area.polygon).toBe(AREA_POLYGONS[area.id]);
      expect(pointInRing([area.lat, area.lng], area.polygon), area.id).toBe(true);
    }
  });

  test("catalog keys match AreaId set exactly", () => {
    const keys = Object.keys(AREA_POLYGONS).sort() as AreaId[];
    expect(keys).toEqual([...AREA_IDS].sort());
  });

  test("Area cells do not overlap and tile DHAKA_OUTLINE", () => {
    let covered = 0;
    let total = 0;
    let overlaps = 0;
    for (let lat = 23.67; lat <= 23.91; lat += 0.012) {
      for (let lng = 90.3; lng <= 90.52; lng += 0.012) {
        if (!pointInRing([lat, lng], DHAKA_OUTLINE)) continue;
        total++;
        const owners = AREA_IDS.filter((id) =>
          pointInRing([lat, lng], AREA_POLYGONS[id]),
        );
        if (owners.length === 1) covered++;
        if (owners.length > 1) overlaps++;
      }
    }
    expect(overlaps).toBe(0);
    expect(covered / total).toBeGreaterThan(0.98);
  });
});
