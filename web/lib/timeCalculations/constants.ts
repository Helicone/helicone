import { getIncrement, TimeGraphConfig, TimeInterval } from "./time";
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
    dbIncrement: "min",
    start: getXMinutesAgoFloored(60),
    end: getXMinutesAgoFloored(-1),
  },
  "24h": {
    timeMap: (date) =>
      date.toLocaleTimeString(undefined, {
        hour: "2-digit",
      }),

    dbIncrement: "hour",
    start: getXHoursAgoFloored(24),
    end: getXMinutesAgoFloored(-1),
  },
  "7d": {
    timeMap: (date) =>
      date.toLocaleDateString(undefined, {
        dateStyle: "short",
      }),

    dbIncrement: "day",
    start: getXDaysAgoFloored(7),
    end: getXMinutesAgoFloored(-1),
  },
  "1m": {
    timeMap: (date) =>
      date.toLocaleDateString(undefined, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      }),

    dbIncrement: "day",
    start: getXDaysAgoFloored(30),
    end: getXMinutesAgoFloored(-1),
  },
  "3m": {
    timeMap: (startDate) => {
      // returns a format like 01/01 - 01/07
      const increment = getIncrement(30 * 3 * 24 * 60 * 60 * 1000);

      const endDate = new Date(startDate.getTime() + increment - 1);
      return `${startDate.toLocaleDateString(undefined, {
        month: "2-digit",
        day: "2-digit",
      })} - ${endDate.toLocaleDateString(undefined, {
        month: "2-digit",
        day: "2-digit",
      })}`;
    },
    dbIncrement: "day",
    start: getXDaysAgoFloored(30 * 3),
    end: getXMinutesAgoFloored(-1),
  },
  all: {
    timeMap: (startDate) => {
      // returns a format like 01/01 - 01/07
      const increment = getIncrement(30 * 3 * 24 * 60 * 60 * 1000);

      const endDate = new Date(startDate.getTime() + increment - 1);
      return `${startDate.toLocaleDateString(undefined, {
        month: "2-digit",
        day: "2-digit",
      })} - ${endDate.toLocaleDateString(undefined, {
        month: "2-digit",
        day: "2-digit",
      })}`;
    },
    dbIncrement: "week",
    start: getXDaysAgoFloored(30 * 3),
    end: getXMinutesAgoFloored(-1),
  },
};

export function getTimeMap(start: Date, end: Date) {
  const totalTime = end.getTime() - start.getTime();
  if (totalTime <= 1000 * 60 * 60 * 2) {
    // less than 1 hour
    return timeGraphConfig["1h"].timeMap;
  } else if (totalTime <= 1000 * 60 * 60 * 24 * 2) {
    // less than 1 day
    return timeGraphConfig["24h"].timeMap;
  } else if (totalTime <= 1000 * 60 * 60 * 24 * 7 * 2) {
    // less than 1 week
    return timeGraphConfig["7d"].timeMap;
  } else if (totalTime <= 1000 * 60 * 60 * 24 * 30 * 2) {
    // less than 1 month
    return timeGraphConfig["1m"].timeMap;
  } else if (totalTime <= 1000 * 60 * 60 * 24 * 30 * 3 * 2) {
    // less than 3 months
    return timeGraphConfig["3m"].timeMap;
  } else {
    // more than 3 months
    return timeGraphConfig["all"].timeMap;
  }
}
