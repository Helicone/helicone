import { TimeGraphConfig, TimeInterval } from "./time";
import {
  getXDaysAgoFloored,
  getXHoursAgoFloored,
  getXMinutesAgoFloored,
  getXMinutesAgoCeiling,
  getXHoursAgoCeiling,
  getXDaysAgoCeiling,
} from "./getXHoursAgo";

export const timeGraphConfig: Record<TimeInterval, TimeGraphConfig> = {
  "1h": {
    timeMap: (date) => date.toLocaleTimeString(),
    increment: (date) => new Date(date.getTime() + 60 * 1000 * 5), // every 5 minutes
    dbIncrement: "min",
    start: getXMinutesAgoFloored(60),
    end: getXMinutesAgoFloored(0),
  },
  "24h": {
    timeMap: (date) =>
      date.toLocaleTimeString(undefined, {
        hour: "2-digit",
      }),
    increment: (date) => new Date(date.getTime() + 60 * 60 * 1000), // every 2 hours
    dbIncrement: "hour",
    start: getXHoursAgoFloored(24),
    end: getXHoursAgoFloored(0),
  },
  "7d": {
    timeMap: (date) =>
      date.toLocaleDateString(undefined, {
        dateStyle: "short",
      }),
    increment: (date) => new Date(date.getTime() + 24 * 60 * 60 * 1000), // every day
    dbIncrement: "day",
    start: getXDaysAgoFloored(7),
    end: getXDaysAgoFloored(0),
  },
  "1m": {
    timeMap: (date) =>
      date.toLocaleDateString(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      }),
    increment: (date) => new Date(date.getTime() + 24 * 60 * 60 * 1000), // every day
    dbIncrement: "day",
    start: getXDaysAgoFloored(30),
    end: getXDaysAgoFloored(0),
  },
  "3m": {
    timeMap: (date) =>
      date.toLocaleDateString(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      }),
    increment: (date) => new Date(date.getTime() + 24 * 60 * 60 * 7 * 1000), // every week
    dbIncrement: "day",
    start: getXDaysAgoFloored(30 * 3),
    end: getXDaysAgoFloored(0),
  },
};
