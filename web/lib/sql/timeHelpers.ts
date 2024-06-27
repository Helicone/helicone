import { TimeIncrement } from "../timeCalculations/fetchTimeData";

export function isValidTimeZoneDifference(timeZoneDifference: number): boolean {
  const minutesInDay = 24 * 60;
  return (
    !isNaN(timeZoneDifference) &&
    timeZoneDifference >= -minutesInDay &&
    timeZoneDifference <= minutesInDay
  );
}

export function isValidTimeIncrement(timeIncrement: TimeIncrement): boolean {
  const validIncrements = ["min", "hour", "day", "week", "month", "year"];
  return validIncrements.includes(timeIncrement);
}

export function isValidTimeFilter(filter: {
  start: string;
  end: string;
}): boolean {
  const start = new Date(filter.start);
  const end = new Date(filter.end);
  return start <= end;
}

export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} days ago`;
  } else if (hours > 0) {
    return `${hours} hrs ago`;
  } else if (minutes > 0) {
    return `${minutes} min ago`;
  } else {
    return `${seconds} sec ago`;
  }
};
