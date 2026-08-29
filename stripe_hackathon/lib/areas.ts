import { AREA_POLYGONS, type LatLng } from "./area-polygons";
import type { AreaId } from "./types";

export type Area = {
  id: AreaId;
  name: string;
  lat: number;
  lng: number;
  /** Closed Leaflet ring [lat, lng] — neighborhood outline, not a DESCO feeder. */
  polygon: LatLng[];
};

/** Centroids match scripts/build-dhaka-partition.mjs Voronoi sites. */
export const AREAS: readonly Area[] = [
  { id: "dhanmondi", name: "Dhanmondi", lat: 23.7465, lng: 90.376, polygon: AREA_POLYGONS.dhanmondi },
  { id: "gulshan", name: "Gulshan", lat: 23.7905, lng: 90.414, polygon: AREA_POLYGONS.gulshan },
  { id: "banani", name: "Banani", lat: 23.7995, lng: 90.4035, polygon: AREA_POLYGONS.banani },
  { id: "mirpur-10", name: "Mirpur-10", lat: 23.8071, lng: 90.3686, polygon: AREA_POLYGONS["mirpur-10"] },
  { id: "uttara", name: "Uttara", lat: 23.8759, lng: 90.3795, polygon: AREA_POLYGONS.uttara },
  { id: "mohammadpur", name: "Mohammadpur", lat: 23.7574, lng: 90.3615, polygon: AREA_POLYGONS.mohammadpur },
  { id: "motijheel", name: "Motijheel", lat: 23.7295, lng: 90.4172, polygon: AREA_POLYGONS.motijheel },
  { id: "lalbagh", name: "Lalbagh", lat: 23.719, lng: 90.3882, polygon: AREA_POLYGONS.lalbagh },
  { id: "bashundhara", name: "Bashundhara", lat: 23.8199, lng: 90.4526, polygon: AREA_POLYGONS.bashundhara },
  { id: "tejgaon", name: "Tejgaon", lat: 23.7636, lng: 90.391, polygon: AREA_POLYGONS.tejgaon },
  { id: "badda", name: "Badda", lat: 23.7806, lng: 90.4266, polygon: AREA_POLYGONS.badda },
  { id: "wari", name: "Wari", lat: 23.7166, lng: 90.4258, polygon: AREA_POLYGONS.wari },
];

export const DHAKA_CENTER: [number, number] = [23.78, 90.4];
