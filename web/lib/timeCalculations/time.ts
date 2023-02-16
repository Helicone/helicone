import { DateCountDBModel } from "../api/metrics/getTimeData";
import { TimeData, TimeIncrement } from "./fetchTimeData";

export type TimeInterval = "3m" | "1m" | "7d" | "24h" | "1h";
export interface TimeGraphConfig {
  timeMap: (date: Date) => string;
  increment: (date: Date) => Date;
  dbIncrement: TimeIncrement;
  start: Date;
  end: Date;
}

const NUMBER_OF_BINS = 100;

const getIncrement = (totalTime: number) => {
  if (totalTime < 1000 * 60 * 60 * 2) {
    // less than 1 hour
    // Increment by 5 minutes
    return 1000 * 60 * 5;
  }
  if (totalTime < 1000 * 60 * 60 * 24 * 2) {
    // less than 1 day
    // Increment by 3 hour
    return 1000 * 60 * 60 * 3;
  }
  if (totalTime < 1000 * 60 * 60 * 24 * 7 * 2) {
    // less than 7 days
    // Increment by 1 day
    return 1000 * 60 * 60 * 24;
  }
  if (totalTime < 1000 * 60 * 60 * 24 * 30 * 2) {
    // less than 32 days
    // Increment by 1 day
    return 1000 * 60 * 60 * 24;
  }
  if (totalTime < 1000 * 60 * 60 * 24 * 30 * 6) {
    // less than 6 months
    // Increment by 7 days
    return 1000 * 60 * 60 * 24 * 7;
  }
  //default to 1 month
  return 1000 * 60 * 60 * 24 * 30;
};

export function timeBackfill(
  data: DateCountDBModel[],
  start: Date,
  end: Date
): TimeData[] {
  const result: TimeData[] = [];
  let current = start;

  const totalTime = end.getTime() - current.getTime();
  const increment = (date: Date) =>
    new Date(date.getTime() + getIncrement(totalTime));
<<<<<<< HEAD
  console.log("DATA", data);
=======
>>>>>>> dfeaf401f21b61899c0f32472a3184e3a88a958c
  while (current < end) {
    const nextTime = increment(current);
    const count = data
      .filter(
        (d) => d.created_at_trunc >= current && d.created_at_trunc < nextTime
      )
      .reduce((acc, d) => acc + d.count, 0);

    result.push({ time: nextTime, count });
    current = nextTime;
  }
  return result;
}
