import type { Locale } from "./i18n";
import type { AreaId } from "./types";

export type Advice = {
  headline: string;
  body: string;
  kit: string[];
};

const COMMON_CLOSE_EN =
  "This is canned Advice from a Sample pattern, not a site survey and not DESCO. Treat it as rehearsal for the hour the lights are out.";

const COMMON_CLOSE_BN =
  "এটি নমুনা প্যাটার্ন থেকে তৈরি পরামর্শ, সাইট সার্ভে বা DESCO নয়। আলো নিভে গেলে কী করবেন তার অনুশীলন হিসেবে নিন।";

const EN: Record<AreaId, Advice> = {
  dhanmondi: {
    headline:
      "Lake belt, stacked flats, one transformer that everyone knows by sound",
    body: `Dhanmondi evenings often brown out when ACs stack on the same feeder. If Status is Off, assume the next 40–90 minutes are a fridge-and-router problem, not a whole-night outage — unless the Seed bars have been dark since afternoon.

Walk the stairwell: if neighbouring buildings still glow, it is your building's DB or a local trip. If the lakeside is black too, wait; calling the line-man during a rolling cut rarely moves the truck.

Charge phones from a power bank first, not the IPS. Keep the IPS for the router and one light. The SAMPLE PATTERN stamp on this card means the restore time is from mock history, not a live DESCO clock.

${COMMON_CLOSE_EN}`,
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

${COMMON_CLOSE_EN}`,
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

${COMMON_CLOSE_EN}`,
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

${COMMON_CLOSE_EN}`,
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

${COMMON_CLOSE_EN}`,
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

${COMMON_CLOSE_EN}`,
    kit: [
      "Trust your pin, not the bazaar lights",
      "Rice in the first 20 minutes of a cut",
      "Unplug the fridge from a shared mess IPS",
    ],
  },
  motijheel: {
    headline:
      "Office belt: the cut is a commute problem as much as a home problem",
    body: `Motijheel Status Off after 7pm is mostly empty towers and a few night desks. If you are still in the office, lifts are the risk. If you live in the nearby lanes, you are on a different story than the glass buildings.

Crowd-tap what you see on YOUR floor. A lit skyline does not mean your lift motor has current. Carry water on the stairs. The Advice here assumes a desk worker stuck after hours, not a resident in Paltan.

${COMMON_CLOSE_EN}`,
    kit: [
      "Do not call the lift if the cut is already on",
      "Report the floor you are on, not the skyline",
      "Water bottle before you take the stairs",
    ],
  },
  lalbagh: {
    headline:
      "Old Dhaka wiring, old manners: ask the neighbour before the Facebook group",
    body: `Lalbagh and the old city lose power in patches the size of a mahalla, not a sector. Your pin is coarse. Knock next door. If they have current and you do not, it is a local fuse, not a feeder.

Keep a kerosene or rechargeable lantern that is not your phone. Narrow lanes get pitch dark. Seed Forecast is almost theatre here — the real signal is the Crowd tap from the next lane.

${COMMON_CLOSE_EN}`,
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

${COMMON_CLOSE_EN}`,
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

${COMMON_CLOSE_EN}`,
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

${COMMON_CLOSE_EN}`,
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

${COMMON_CLOSE_EN}`,
    kit: [
      "Router on a tiny UPS, nothing else",
      "On a tie, trust the latest Crowd tap",
      "Burning smell at the meter: leave, do not wait on Forecast",
    ],
  },
};

const BN: Record<AreaId, Advice> = {
  dhanmondi: {
    headline: "হ্রদপাড়, স্তরে স্তরে ফ্ল্যাট, সবার চেনা ট্রান্সফর্মার",
    body: `ধানমন্ডিতে সন্ধ্যার এসি লোডে প্রায়ই ব্রাউন-আউট হয়। Status Off হলে পরের ৪০–৯০ মিনিট ফ্রিজ ও রাউটারের সমস্যা ধরুন, সারারাত নয় — দুপুর থেকে সিড অন্ধকার না থাকলে।

সিঁড়িতে দেখুন: পাশের বাড়িতে আলো থাকলে আপনার বিল্ডিং DB বা লোকাল ট্রিপ। হ্রদপাড়ও অন্ধকার হলে অপেক্ষা করুন।

ফোন পাওয়ার ব্যাংকে চার্জ করুন, IPS-এ নয়। IPS রাউটার ও এক আলোর জন্য। নমুনা প্যাটার্ন মানে পূর্বাভাস মক ইতিহাস থেকে।

${COMMON_CLOSE_BN}`,
    kit: [
      "IPS শুধু রাউটার + এক আলো",
      "ফোনে পাওয়ার ব্যাংক; কেটলি নয়",
      "হ্রদে আলো, আপনার নেই → বিল্ডিং DB দেখুন",
    ],
  },
  gulshan: {
    headline: "ছাদে ডিজেল, তবু পাম্পে লাইন",
    body: `গুলশান নিরাপদ মনে হয় যতক্ষণ জেনারেটরে ডিজেল থাকে। প্রাইভেট জেনসেট থাকায় রাস্তার চেহারা মিথ্যা বলতে পারে।

Status Off হলে আগে জেনারেটর শুনুন। নিরিবিলি ব্লক কিন্তু টাওয়ারে আলো = জ্বালানি সমস্যা। মূল সড়কসহ অন্ধকার = আসল কাট।

বন্ধ বেসমেন্টে জেনারেটর চালাবেন না।

${COMMON_CLOSE_BN}`,
    kit: [
      "সূর্যাস্তের আগে ডিজেল দেখুন",
      "ফ্ল্যাটের মধ্যে একটা শেয়ারড বোর্ড",
      "রাস্তা+টাওয়ার অন্ধকার = ফিডার; টাওয়ার গমগম = জ্বালানি",
    ],
  },
  banani: {
    headline: "অফিস ও বাসার একই সন্ধ্যার পিক",
    body: `বনানীর কাট প্রায়ই অফিস লোড নামলে শুরু হয়। বাড়ি থেকে কাজ করলে ৬টার আগে সেভ করুন। পূর্বাভাস সিড থিয়েটার — আত্মবিশ্বাসী দেখালেও অনুমান।

অফ হলে আগে এসি বন্ধ করুন। এক আলো, রাউটার, ল্যাপটপ। পুরনো বিল্ডিংয়ে লিফট এড়িয়ে সিঁড়ি নিন।

${COMMON_CLOSE_BN}`,
    kit: [
      "কর্মদিবসে ৬টার আগে সেভ",
      "এসি IPS থেকে নামান; ল্যাপটপ রাখুন",
      "১০ মিনিট পেরোলে সিঁড়ি",
    ],
  },
  "mirpur-10": {
    headline: "ঘন এলাকা, গরম, আসল কষ্ট পানির পাম্প",
    body: `মিরপুর-১০ ইফতার ও ক্রিকেট রাতে Off হয় বেশি। ছাদের পাম্প বন্ধ হলে সকালে পানি শুকনো।

Off হলে ট্যাংকে চাপ থাকতে বালতি ভরুন। দুর্বল IPS-এ পাম্প চালাবেন না। সিড বার বার Off দেখালে এখন রান্না করুন।

${COMMON_CLOSE_BN}`,
    kit: [
      "চাপ থাকতে বালতি ভরুন",
      "পাম্প IPS-এ নয়",
      "প্রথম Off-এ রান্না যদি সিড পুনরাবৃত্ত হয়",
    ],
  },
  uttara: {
    headline: "লম্বা ফিডার, লম্বা অপেক্ষা, নতুন কংক্রিট",
    body: `উত্তরার সেক্টরে কাট দীর্ঘস্থায়ী। কার্ডের মিনিট সিড গ্যাপ থেকে — আপনার তিন সন্ধ্যা দুই ঘণ্টা হলে সেটাই বিশ্বাস করুন।

USB ফ্যান রাখুন। সেক্টর রাস্তা অন্ধকার; হেডল্যাম্প ভালো। কেয়ারটেকারকে ডিজেল জিজ্ঞাসা করুন।

${COMMON_CLOSE_BN}`,
    kit: [
      "USB ফ্যান",
      "সেক্টর রাস্তায় হেডল্যাম্প",
      "সন্ধ্যার আগে জেনসেট ডিজেল জানুন",
    ],
  },
  mohammadpur: {
    headline: "বাজার লণ্ঠনে জ্বলে; বাড়ি আগে অন্ধকার হয়",
    body: `মোহাম্মদপুর বাজার দোকানের জেনারেটরে জ্বলতে পারে, অথচ গলিতে Off। মূল সড়ককে Status ভেবে ভুল করবেন না।

পিন Off হলে প্রথম ২০ মিনিটে ভাত শেষ করুন। পুরনো বাড়িতে পাম্প নষ্ট হয়; ২০ লিটার জমিয়ে রাখুন।

${COMMON_CLOSE_BN}`,
    kit: [
      "বাজারের আলো নয়, পিন বিশ্বাস করুন",
      "কাটের প্রথম ২০ মিনিটে ভাত",
      "শেয়ারড IPS থেকে ফ্রিজ নামান",
    ],
  },
  motijheel: {
    headline: "অফিস বেল্ট: কাট যাতায়াতের সমস্যাও",
    body: `সন্ধ্যা ৭টার পর মতিঝিলের Off প্রায়ই ফাঁকা টাওয়ার। অফিসে থাকলে লিফট ঝুঁকি। কাছের গলিতে থাকলে কাচের ভবনের গল্প আলাদা।

আপনার ফ্লোরের অবস্থা ট্যাপ করুন। সিঁড়িতে পানি নিয়ে নামুন।

${COMMON_CLOSE_BN}`,
    kit: [
      "কাট চললে লিফট ডাকবেন না",
      "স্কাইলাইন নয়, নিজের ফ্লোর রিপোর্ট",
      "সিঁড়ির আগে পানির বোতল",
    ],
  },
  lalbagh: {
    headline: "পুরনো ঢাকার ওয়্যারিং: আগে প্রতিবেশীকে জিজ্ঞাসা",
    body: `লালবাগে পাড়ায় পাড়ায় কাট হয়, সেক্টর নয়। দরজায় কড়া নাড়ুন। প্রতিবেশীর আছে আপনার নেই = লোকাল ফিউজ।

ফোন নয়, লণ্ঠন রাখুন। আসল সিগন্যাল পাশের গলির Crowd ট্যাপ।

${COMMON_CLOSE_BN}`,
    kit: [
      "ফিডার ভাবার আগে প্রতিবেশীকে জিজ্ঞাসা",
      "ফোন-ছাড়া লণ্ঠন",
      "পূর্বাভাসের আগে লোকাল ফিউজ বক্স",
    ],
  },
  bashundhara: {
    headline: "ব্লক, বিশাল পাম্প, সপ্তাহান্তের ওয়েল্ডিং",
    body: `বসুন্ধরায় শনিবার নির্মাণ ও পাম্প একসাথে লোড বাড়ায়। দুপুরের Off প্রায়ই সেটা।

উঁচু তলায় প্রথমে পানি যায়। বৃহস্পতিবার ট্যাংক দেখুন। সকাল ১১টার কাটে সন্ধ্যার পূর্বাভাস এড়িয়ে চলুন।

${COMMON_CLOSE_BN}`,
    kit: [
      "বৃহস্পতিবার ছাদের ট্যাংক দেখুন",
      "শনি দুপুরের Off প্রায়ই ওয়েল্ডার",
      "সকালের কাটে সন্ধ্যার পূর্বাভাস উপেক্ষা",
    ],
  },
  tejgaon: {
    headline: "শিল্প+বাসস্থান: যে গমগম শুনছেন তা আপনার নাও হতে পারে",
    body: `তেজগাঁওয়ে কারখানা আছে। আপনার রাস্তার মতো কাট আসলে শিল্প ফিডার হতে পারে। গার্মেন্টস তলায় আলো আছে কি?

বাড়ি Off, শেড On = গার্হস্থ্য লাইন। সব Off হলে কার্ডের চেয়ে বেশি অপেক্ষা — সিড সাবস্টেশন ট্রিপ মডেল করে না।

${COMMON_CLOSE_BN}`,
    kit: [
      "বাড়ির আলো ও কারখানা তুলনা",
      "পুরো অন্ধকারে পূর্বাভাসের চেয়ে বেশি অপেক্ষা",
      "এক আলো, ইস্ত্রি নয়",
    ],
  },
  badda: {
    headline: "রামপুরা–বাড্ডা: বৃষ্টি, জলাবদ্ধতা, ট্রিপড বক্স",
    body: `বাড্ডায় বৃষ্টিতে Off প্রায়ই রাস্তার বক্স ট্রিপ, পরিকল্পিত কাট নয়। ছবি তুলতে জলে নামবেন না। বাড়ি থেকে Off ট্যাপ করুন।

বৃষ্টি থেমেও Off থাকলে ভেজা জয়েন্ট হতে পারে। ইলেকট্রনিক্স মেঝেতে রাখবেন না।

${COMMON_CLOSE_BN}`,
    kit: [
      "বাড়ি থেকে Off ট্যাপ; বক্সে নামবেন না",
      "বৃষ্টিতে ইলেকট্রনিক্স মেঝেতে নয়",
      "প্রতিটি চালু ঝলকে চার্জ",
    ],
  },
  wari: {
    headline: "সরু গলি, শেয়ারড মিটার, এক ফ্ল্যাটে সিঁড়ি ডিপ",
    body: `ওয়ারীর পুরনো ওয়্যারিংয়ে এক ওয়েল্ডিং দোকান পুরো সিঁড়ি ডিপ করতে পারে। একই ৩০ মিনিটে On/Off লড়াই — টাইতে সর্বশেষ ট্যাপই বিশ্বাস।

শুধু রাউটারে ছোট UPS। মিটারে পোড়ার গন্ধ লোডশেডিং নয় — বেরিয়ে লাইনম্যান ডাকুন।

${COMMON_CLOSE_BN}`,
    kit: [
      "শুধু রাউটারে ছোট UPS",
      "টাইতে সর্বশেষ Crowd ট্যাপ",
      "মিটারে পোড়ার গন্ধ: বেরিয়ে যান",
    ],
  },
};

export function adviceForArea(
  areaId: AreaId,
  locale: Locale = "en",
): Advice {
  return (locale === "bn" ? BN : EN)[areaId];
}
