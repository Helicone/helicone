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
