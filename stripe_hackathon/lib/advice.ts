import type { AreaId } from "./types";

export type Advice = {
  headline: string;
  body: string;
  kit: string[];
};

const COMMON_CLOSE =
  "This is canned Advice from a Sample pattern, not a site survey and not DESCO. Treat it as rehearsal for the hour the lights are out.";

const BY_AREA: Record<AreaId, Omit<Advice, "kit"> & { kit: string[] }> = {
  dhanmondi: {
    headline: "Lake belt, stacked flats, one transformer that everyone knows by sound",
    body: `Dhanmondi evenings often brown out when ACs stack on the same feeder. If Status is Off, assume the next 40–90 minutes are a fridge-and-router problem, not a whole-night outage — unless the Seed bars have been dark since afternoon.

Walk the stairwell: if neighbouring buildings still glow, it is your building's DB or a local trip. If the lakeside is black too, wait; calling the line-man during a rolling cut rarely moves the truck.

Charge phones from a power bank first, not the IPS. Keep the IPS for the router and one light. The SAMPLE PATTERN stamp on this card means the restore time is from mock history, not a live DESCO clock.

${COMMON_CLOSE}`,
    kit: [
      "IPS on router + one tube, nothing else",
      "Power bank for phones; skip the kettle",
      "If the lake is lit and you are not, check the building DB",
    ],
  },
  gulshan: {
    headline: "Diesel on every other roof, still a queue at the pump",
    body: `Gulshan looks immune until the generator diesel runs out at 9pm. Crowd Reports here swing Off even when Circle-1 still has current, because so many buildings are on private gensets that the street look lies.

If Status is Off, listen for generators before you assume a feeder cut. A quiet block with lit towers is a fuel problem. A dark circle including the main road is a real cut — then the Forecast line on this card is the useful number.

Do not idle a generator in a closed basement. Open the parking exhaust. Share a socket with the next flat only through a proper board, not a cheap coil.

${COMMON_CLOSE}`,
    kit: [
      "Check diesel before sundown, not after the cut",
      "One shared board between flats, not daisy-chained strips",
      "Street dark + towers dark = feeder; street dark + towers loud = fuel",
    ],
  },
  banani: {
    headline: "Offices dump onto the same evening peak as the apartments",
    body: `Banani's cut often starts when offices dump load and homes pick it up. If you work from home, save before 6. The Forecast here is theater from Seed: it will look confident and still be a guess.

Keep the work laptop at 80% by late afternoon. When Off hits, kill the AC first — that is what trips the stair IPS. One light, router, laptop. Elevators in older buildings will trap people; use stairs if the cut is already 10 minutes old.

${COMMON_CLOSE}`,
    kit: [
      "Save work before 6pm on weekdays",
      "AC off the IPS; laptop on it",
      "Stairs if the cut is already older than 10 minutes",
    ],
  },
  "mirpur-10": {
    headline: "Dense, hot, and the water pump is the thing you actually miss",
    body: `Mirpur-10 Crowd Reports go Off hard around Iftar months and cricket nights. The hidden failure is the rooftop pump: tanks empty, morning is dry.

When Status flips Off, fill buckets from the tank tap while there is still head. Do not run the pump on a struggling IPS. Charge lights, then phones. If the Seed chart shows repeated Off every ~45 minutes, that is a rolling cut — cook now, not later.

${COMMON_CLOSE}`,
    kit: [
      "Fill buckets while the tank still has pressure",
      "Pump stays off the IPS",
      "Cook on the first Off if the Seed bars keep repeating",
    ],
  },
  uttara: {
    headline: "Long feeders, long waits, lots of new concrete",
    body: `Uttara sectors sit on long feeders. Cuts last. The Forecast minutes on this card are from Seed gaps — if they say 40 and your last three evenings were two hours, believe your evenings.

Keep a fan that runs on DC USB. Sector roads are dark; if you must go out, a headlamp beats a phone torch. Generators in new buildings often have no diesel contract — ask the caretaker before you need him.

${COMMON_CLOSE}`,
    kit: [
      "USB fan beats a roaring IPS fan",
      "Headlamp for sector roads",
      "Ask diesel status of the building genset before dusk",
    ],
  },
  mohammadpur: {
    headline: "Markets stay open on lanterns; homes go dark first",
    body: `Mohammadpur bazaar often glows on shop generators while the lanes behind Krishi Market go Off. Do not read the main road as your Status.

If your Area pin is Off, finish rice on the first 20 minutes of gas. Water pumps in older houses fail; store 20 liters. Shared IPS units in mess houses get overloaded — unplug the fridge if it is already humming on battery.

${COMMON_CLOSE}`,
    kit: [
      "Trust your pin, not the bazaar lights",
      "Rice in the first 20 minutes of a cut",
      "Unplug the fridge from a shared mess IPS",
    ],
  },
  motijheel: {
    headline: "Office belt: the cut is a commute problem as much as a home problem",
    body: `Motijheel Status Off after 7pm is mostly empty towers and a few night desks. If you are still in the office, lifts are the risk. If you live in the nearby lanes, you are on a different story than the glass buildings.

Crowd-tap what you see on YOUR floor. A lit skyline does not mean your lift motor has current. Carry water on the stairs. The Advice here assumes a desk worker stuck after hours, not a resident in Paltan.

${COMMON_CLOSE}`,
    kit: [
      "Do not call the lift if the cut is already on",
      "Report the floor you are on, not the skyline",
      "Water bottle before you take the stairs",
    ],
  },
  lalbagh: {
    headline: "Old Dhaka wiring, old manners: ask the neighbour before the Facebook group",
    body: `Lalbagh and the old city lose power in patches the size of a mahalla, not a sector. Your pin is coarse. Knock next door. If they have current and you do not, it is a local fuse, not a feeder.

Keep a kerosene or rechargeable lantern that is not your phone. Narrow lanes get pitch dark. Seed Forecast is almost theatre here — the real signal is the Crowd tap from the next lane.

${COMMON_CLOSE}`,
    kit: [
      "Ask the neighbour before you assume a feeder cut",
      "Lantern that is not a phone",
      "Local fuse box before you wait on Forecast minutes",
    ],
  },
  bashundhara: {
    headline: "RERA blocks, huge pumps, weekend construction welders",
    body: `Bashundhara load spikes when construction welders and apartment pumps share a Saturday. Status Off at noon is often that, not a national shortfall.

If you are in a high floor, water is the first casualty. Keep rooftop tank levels in mind on Thursday. Weekend Forecast on this card will look busy because Seed is biased to evening — ignore a 6pm restore guess at 11am.

${COMMON_CLOSE}`,
    kit: [
      "Watch the rooftop tank on Thursday",
      "Noon Off on Saturday is often welders, not a feeder death",
      "Ignore an evening Forecast if the cut is at 11am",
    ],
  },
  tejgaon: {
    headline: "Industrial + residential mix: the hum you hear is not always yours",
    body: `Tejgaon still has factories. A cut that looks like your street may be a dedicated industrial feeder. Check whether the garment floors still glow.

If homes are Off and sheds are On, you are on the domestic tap. Forecast minutes then apply. If everything is Off including the main 37, wait longer than the card says — Seed does not model a substation trip.

${COMMON_CLOSE}`,
    kit: [
      "Compare home lights to factory floors",
      "Substation-quiet + total dark: wait longer than Forecast",
      "One light, not the iron",
    ],
  },
  badda: {
    headline: "Rampura–Badda belt: rain, waterlogging, and tripped boxes",
    body: `Badda Off during rain is often a tripped roadside box, not a planned cut. Do not wade to take a photo for the Crowd Report. Tap Off from home.

If the rain has stopped and Status is still Off after the Forecast window, it may be a wet joint. Keep electronics off the floor. Charge while you still have a blip of On — rain cuts flicker.

${COMMON_CLOSE}`,
    kit: [
      "Tap Off from inside; do not wade to the box",
      "Electronics off the floor in rain",
      "Charge on every flicker of On",
    ],
  },
  wari: {
    headline: "Tight streets, shared meters, one flat can brown the stair",
    body: `Wari's wiring is old enough that one welding shop can dip the whole stair. Status here will fight itself: On and Off Reports in the same 30 minutes. Believe the latest tap, which is what Batti already does on a tie.

Keep a small UPS for the router only. Neighbour coordination matters more than Forecast. If you smell burning at the meter, that is not load-shedding — leave and call for a line-man, do not wait on this card.

${COMMON_CLOSE}`,
    kit: [
      "Router on a tiny UPS, nothing else",
      "On a tie, trust the latest Crowd tap",
      "Burning smell at the meter: leave, do not wait on Forecast",
    ],
  },
};

export function adviceForArea(areaId: AreaId): Advice {
  return BY_AREA[areaId];
}
