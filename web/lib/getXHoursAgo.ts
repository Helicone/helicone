export function getXMinuteasAgoFloored(minutes: number): Date {
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
