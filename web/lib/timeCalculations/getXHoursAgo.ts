/**
 * Returns a Date object representing a specified number of minutes ago, rounded down to the nearest minute.
 * @param minutes - The number of minutes ago.
 * @returns A Date object representing the specified number of minutes ago.
 */
export function getXMinutesAgoFloored(minutes: number): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    now.getMinutes() - minutes,
    0,
    0
  );
}

/**
 * Returns a Date object representing a specified number of hours ago, rounded down to the nearest hour.
 * @param hours - The number of hours ago.
 * @returns A Date object representing the specified number of hours ago.
 */
export function getXHoursAgoFloored(hours: number): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours() - hours,
    0,
    0,
    0
  );
}

/**
 * Returns a Date object representing a specific number of days ago, rounded down to the nearest day.
 * @param days - The number of days ago.
 * @returns A Date object representing the specified number of days ago.
 */
export function getXDaysAgoFloored(days: number): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - days,
    0,
    0,
    0,
    0
  );
}

/**
 * Returns a Date object representing a specific number of weeks ago, floored to the nearest day.
 * @param weeks - The number of weeks ago.
 * @returns A Date object representing the specified number of weeks ago.
 */
export function getXWeeksAgoFloored(weeks: number): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - weeks * 7,
    0,
    0,
    0,
    0
  );
}

/**
 * Returns a Date object representing a specific number of months ago, rounded down to the nearest day.
 * @param months - The number of months ago.
 * @returns A Date object representing the specified number of months ago.
 */
export function getXMonthsAgoFloored(months: number): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth() - months,
    now.getDate(),
    0,
    0,
    0,
    0
  );
}

/**
 * Returns a Date object representing the current time minus the specified number of minutes,
 * rounded up to the nearest minute.
 * @param minutes - The number of minutes ago.
 * @returns A Date object representing the current time minus the specified number of minutes,
 * rounded up to the nearest minute.
 */
export function getXMinutesAgoCeiling(minutes: number): Date {
  const now = getXMinutesAgoFloored(minutes);
  return new Date(now.getTime() + 60 * 1000);
}

/**
 * Returns a Date object representing the ceiling value of X hours ago.
 * @param hours - The number of hours ago.
 * @returns A Date object representing the ceiling value of X hours ago.
 */
export function getXHoursAgoCeiling(hours: number): Date {
  const now = getXHoursAgoFloored(hours);
  return new Date(now.getTime() + 60 * 60 * 1000);
}

/**
 * Returns a Date object representing the ceiling value of X days ago.
 * @param days - The number of days ago.
 * @returns A Date object representing the ceiling value of X days ago.
 */
export function getXDaysAgoCeiling(days: number): Date {
  const now = getXDaysAgoFloored(days);
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Calculates the date and time of a certain number of weeks ago, rounded up to the nearest week.
 * @param weeks The number of weeks ago.
 * @returns The date and time of the specified number of weeks ago, rounded up to the nearest week.
 */
export function getXWeeksAgoCeiling(weeks: number): Date {
  const now = getXWeeksAgoFloored(weeks);
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
}

/**
 * Calculates the date and time that is a specified number of months ago, rounded up to the nearest month.
 * @param months - The number of months ago.
 * @returns The calculated date and time.
 */
export function getXMonthsAgoCeiling(months: number): Date {
  const now = getXMonthsAgoFloored(months);
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
}
