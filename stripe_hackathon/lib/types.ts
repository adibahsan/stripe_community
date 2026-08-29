export type AreaId =
  | "dhanmondi"
  | "gulshan"
  | "banani"
  | "mirpur-10"
  | "uttara"
  | "mohammadpur"
  | "motijheel"
  | "lalbagh"
  | "bashundhara"
  | "tejgaon"
  | "badda"
  | "wari";

export type ReportKind = "on" | "off" | "unsure";

export type Status = "on" | "off" | "stale";

export type Report = {
  areaId: AreaId;
  kind: ReportKind;
  at: string;
};

export type Forecast = {
  typicalRestoreMinutes: number;
  sampleHour: number;
  offCountAtHour: number;
};

export type Eta = {
  direction: "on" | "off";
  minutes: number;
};
