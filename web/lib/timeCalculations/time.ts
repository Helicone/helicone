import { TimeIncrement } from "./fetchTimeData";

export type TimeInterval = "3m" | "1m" | "7d" | "24h" | "1h" | "all" | "custom";

export function getTimeIntervalAgo(interval: TimeInterval): Date {
  const now = new Date();
  switch (interval) {
    case "3m":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "1m":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "7d":
      return new Date(now.setDate(now.getDate() - 7));
    case "24h":
      return new Date(now.setDate(now.getDate() - 1));
    case "1h":
      return new Date(now.setHours(now.getHours() - 1));
    case "all":
      return new Date(0);
    default:
      return new Date(0);
  }
}

export interface TimeGraphConfig {
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
  if (totalTime < 1000 * 60 * 60 * 24 * 7) {
    // less than 7 day
    // Increment by 3 hour
    return 1000 * 60 * 60 * 3;
  }
  if (totalTime <= 1000 * 60 * 60 * 24 * 7 * 2) {
    // less than 14 days
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
    const initialClone = { ...initial };
    const val = data
      .filter(
        (d) => d.created_at_trunc >= current && d.created_at_trunc < nextTime
      )
      .reduce((acc, d) => reducer(acc, d), initialClone);

    result.push({ time: current, ...val });
    current = nextTime;
  }
  return result;
}

export const getTimeInterval = ({
  start,
  end,
}: {
  start: Date;
  end: Date;
}): TimeIncrement => {
  const diff = end.getTime() - start.getTime();

  if (diff < 1000 * 60 * 60 * 2) {
    return "min";
  } else if (diff < 1000 * 60 * 60 * 24 * 7) {
    return "hour";
  } else {
    return "day";
  }
};
