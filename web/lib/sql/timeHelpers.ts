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
