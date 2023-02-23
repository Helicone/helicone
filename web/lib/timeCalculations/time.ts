import { FilterLeaf, FilterNode } from "../api/metrics/filters";
import { ModelUsageOverTime } from "../api/metrics/getModelUsageOverTime";
import { DateCountDBModel } from "../api/metrics/getRequestOverTime";
import { RequestsOverTime, TimeIncrement } from "./fetchTimeData";

export type TimeInterval = "3m" | "1m" | "7d" | "24h" | "1h";
export interface TimeGraphConfig {
  timeMap: (date: Date) => string;
  dbIncrement: TimeIncrement;
  start: Date;
  end: Date;
}

export const getIncrement = (totalTime: number) => {
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
    // less than 60 days
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

export function timeBackfill<T, K>(
  data: (T & { created_at_trunc: Date })[],
  start: Date,
  end: Date,
  reducer: (acc: K, d: T) => K,
  initial: K
): (K & { time: Date })[] {
  const result: (K & { time: Date })[] = [];
  let current = start;

  const totalTime = end.getTime() - current.getTime();
  const increment = (date: Date) =>
    new Date(date.getTime() + getIncrement(totalTime));
  while (current < end) {
    const nextTime = increment(current);
    const val = data
      .filter(
        (d) => d.created_at_trunc >= current && d.created_at_trunc < nextTime
      )
      .reduce((acc, d) => reducer(acc, d), initial);

    result.push({ time: current, ...val });
    current = nextTime;
  }
  return result;
}

export const validTimeWindow = (filter: FilterNode): boolean => {
  const start = (filter as FilterLeaf).request?.created_at?.gte;
  const end = (filter as FilterLeaf).request?.created_at?.lte;
  return start !== undefined && end !== undefined;
};

export const getTimeInterval = (filter: FilterNode): TimeIncrement => {
  const start = (filter as FilterLeaf).request?.created_at?.gte;
  const end = (filter as FilterLeaf).request?.created_at?.lte;
  if (!validTimeWindow(filter)) {
    throw new Error("Invalid filter");
  }
  const startD = new Date(start!);
  const endD = new Date(end!);
  const diff = endD.getTime() - startD.getTime();
  if (diff < 1000 * 60 * 60 * 2) {
    return "min";
  } else if (diff < 1000 * 60 * 60 * 24 * 7) {
    return "hour";
  } else {
    return "day";
  }
};
