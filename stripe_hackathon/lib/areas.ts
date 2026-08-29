import type { AreaId } from "./types";

export type Area = {
  id: AreaId;
  name: string;
  lat: number;
  lng: number;
};

export const AREAS: readonly Area[] = [
  { id: "dhanmondi", name: "Dhanmondi", lat: 23.7465, lng: 90.376 },
  { id: "gulshan", name: "Gulshan", lat: 23.7925, lng: 90.4078 },
  { id: "banani", name: "Banani", lat: 23.794, lng: 90.4043 },
  { id: "mirpur-10", name: "Mirpur-10", lat: 23.8071, lng: 90.3686 },
  { id: "uttara", name: "Uttara", lat: 23.8759, lng: 90.3795 },
  { id: "mohammadpur", name: "Mohammadpur", lat: 23.7574, lng: 90.3615 },
  { id: "motijheel", name: "Motijheel", lat: 23.7295, lng: 90.4172 },
  { id: "lalbagh", name: "Lalbagh", lat: 23.719, lng: 90.3882 },
  { id: "bashundhara", name: "Bashundhara", lat: 23.8199, lng: 90.4526 },
  { id: "tejgaon", name: "Tejgaon", lat: 23.7636, lng: 90.391 },
  { id: "badda", name: "Badda", lat: 23.7806, lng: 90.4266 },
  { id: "wari", name: "Wari", lat: 23.7166, lng: 90.4258 },
];

export const DHAKA_CENTER: [number, number] = [23.78, 90.4];
