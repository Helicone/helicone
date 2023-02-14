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

export function getXMinutesAgoCeiling(minutes: number): Date {
  const now = getXMinutesAgoFloored(minutes);
  return new Date(now.getTime() + 60 * 1000);
}

export function getXHoursAgoCeiling(hours: number): Date {
  const now = getXHoursAgoFloored(hours);
  return new Date(now.getTime() + 60 * 60 * 1000);
}

export function getXDaysAgoCeiling(days: number): Date {
  const now = getXDaysAgoFloored(days);
  return new Date(now.getTime() + 24 * 60 * 60 * 1000);
}

export function getXWeeksAgoCeiling(weeks: number): Date {
  const now = getXWeeksAgoFloored(weeks);
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export function getXMonthsAgoCeiling(months: number): Date {
  const now = getXMonthsAgoFloored(months);
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
}
