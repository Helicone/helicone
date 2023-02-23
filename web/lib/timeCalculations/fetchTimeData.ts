export interface RequestsOverTime {
  time: Date;
  count: number;
}

export type TimeIncrement = "min" | "hour" | "day" | "week" | "month" | "year";
