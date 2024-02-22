import { TimeIncrement } from "./fetchTimeData";

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

export function getIncrementAsMinutes(inc: TimeIncrement) {
  switch (inc) {
    case "min":
      return 1;
    case "hour":
      return 60;
    case "day":
      return 60 * 24;
    case "week":
      return 60 * 24 * 7;
    case "month":
      return 60 * 24 * 30;
    case "year":
      return 60 * 24 * 365;
  }
}
