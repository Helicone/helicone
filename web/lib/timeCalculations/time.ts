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
      // Use 1 year ago instead of epoch (1970) to avoid full table scans
      // on large organizations with millions of requests
      return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    default:
      // Default to 1 month ago for safety
      return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
  reducer: (_acc: K, _d: T) => K,
  initial: K,
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
        (d) => d.created_at_trunc >= current && d.created_at_trunc < nextTime,
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

  if (diff < 1000 * 60 * 60 * 6) {
    // Use minute granularity for ranges up to 6 hours
    return "min";
  } else if (diff < 1000 * 60 * 60 * 24 * 3) {
    // Use hourly granularity for ranges up to 3 days
    return "hour";
  } else {
    return "day";
  }
};

export function formatTimeSaved(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(3)} ms`;
  } else if (ms < 1000 * 60) {
    return `${(ms / 1000).toFixed(3)} s`;
  } else if (ms < 1000 * 60 * 60) {
    return `${(ms / (1000 * 60)).toFixed(3)} min`;
  } else if (ms < 1000 * 60 * 60 * 24) {
    return `${(ms / (1000 * 60 * 60)).toFixed(3)} h`;
  } else if (ms < 1000 * 60 * 60 * 24 * 30) {
    return `${(ms / (1000 * 60 * 60 * 24)).toFixed(3)} d`;
  } else if (ms < 1000 * 60 * 60 * 24 * 365) {
    return `${(ms / (1000 * 60 * 60 * 24 * 30)).toFixed(3)} mo`;
  } else {
    return `${(ms / (1000 * 60 * 60 * 24 * 365)).toFixed(3)} y`;
  }
}
