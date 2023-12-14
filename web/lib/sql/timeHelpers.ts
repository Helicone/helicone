import { TimeIncrement } from "../timeCalculations/fetchTimeData";

/**
 * Checks if the given timeZoneDifference is a valid value.
 * A valid timeZoneDifference should be a number within the range of -1440 to 1440 (inclusive).
 *
 * @param timeZoneDifference - The timeZoneDifference to be checked.
 * @returns True if the timeZoneDifference is valid, false otherwise.
 */
export function isValidTimeZoneDifference(timeZoneDifference: number): boolean {
  const minutesInDay = 24 * 60;
  return (
    !isNaN(timeZoneDifference) &&
    timeZoneDifference >= -minutesInDay &&
    timeZoneDifference <= minutesInDay
  );
}

/**
 * Checks if a given time increment is valid.
 * @param timeIncrement - The time increment to check.
 * @returns True if the time increment is valid, false otherwise.
 */
export function isValidTimeIncrement(timeIncrement: TimeIncrement): boolean {
  const validIncrements = ["min", "hour", "day", "week", "month", "year"];
  return validIncrements.includes(timeIncrement);
}

/**
 * Checks if the given time filter is valid.
 * @param filter - The time filter object containing start and end times.
 * @returns A boolean indicating whether the time filter is valid.
 */
export function isValidTimeFilter(filter: {
  start: string;
  end: string;
}): boolean {
  const start = new Date(filter.start);
  const end = new Date(filter.end);
  return start <= end;
}
