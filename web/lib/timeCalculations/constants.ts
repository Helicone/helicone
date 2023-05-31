import { getIncrement, TimeGraphConfig, TimeInterval } from "./time";
import {
  getXDaysAgoFloored,
  getXHoursAgoFloored,
  getXMinutesAgoFloored,
  getXMinutesAgoCeiling,
  getXHoursAgoCeiling,
  getXDaysAgoCeiling,
} from "./getXHoursAgo";
import { TimeIncrement } from "./fetchTimeData";

export const timeGraphConfig: Record<TimeInterval, TimeGraphConfig> = {
  "1h": {
    dbIncrement: "min",
    start: getXMinutesAgoFloored(60),
    end: getXMinutesAgoFloored(-1),
  },
  "24h": {
    dbIncrement: "hour",
    start: getXHoursAgoFloored(24),
    end: getXMinutesAgoFloored(-1),
  },
  "7d": {
    dbIncrement: "day",
    start: getXDaysAgoFloored(7),
    end: getXMinutesAgoFloored(-1),
  },
  "1m": {
    dbIncrement: "day",
    start: getXDaysAgoFloored(30),
    end: getXMinutesAgoFloored(-1),
  },
  "3m": {
    dbIncrement: "week",
    start: getXDaysAgoFloored(30 * 3),
    end: getXMinutesAgoFloored(-1),
  },
  all: {
    dbIncrement: "week",
    start: getXDaysAgoFloored(30 * 3),
    end: getXMinutesAgoFloored(-1),
  },
};

const INC_TO_TIME: {
  [key in TimeIncrement]: (startDate: Date, nextDate?: Date) => string;
} = {
  min: (date) => date.toLocaleTimeString(),
  hour: (date) =>
    date.toLocaleTimeString(undefined, {
      hour: "2-digit",
    }),
  day: (date) =>
    date.toLocaleDateString(undefined, {
      dateStyle: "short",
    }),
  week: (startDate, nextDate) => {
    if (!nextDate) {
      throw new Error("nextDate is required for week");
    }
    return `${startDate.toLocaleDateString(undefined, {
      month: "2-digit",
      day: "2-digit",
    })} - ${nextDate.toLocaleDateString(undefined, {
      month: "2-digit",
      day: "2-digit",
    })}`;
  },
  month: (date) =>
    date.toLocaleDateString(undefined, {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }),
  year: (date) =>
    date.toLocaleDateString(undefined, {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }),
};
export function getTimeMap(inc: TimeIncrement) {
  return INC_TO_TIME[inc];
}
