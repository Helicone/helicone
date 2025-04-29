import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";
import { getTimeInterval } from "@/lib/timeCalculations/time";
import { getTimeMap } from "@/lib/timeCalculations/constants";

/**
 * Creates a smart tick formatter function based on the time range
 * @param start Start date of the data range
 * @param end End date of the data range
 * @returns A formatter function that takes a timestamp and returns a formatted string
 */
export function getSmartTickFormatter(start: Date, end: Date) {
  const increment = getTimeInterval({ start, end });
  const formatter = getTimeMap(increment);

  return (timestamp: number) => {
    const date = new Date(timestamp);
    return formatter(date);
  };
}

/**
 * Calculates optimal tick count based on chart width and time range
 * @param chartWidth Width of the chart container in pixels
 * @param start Start date of the data range
 * @param end End date of the data range
 * @returns The optimal number of ticks to display
 */
export function calculateOptimalTickCount(
  chartWidth: number,
  start: Date,
  end: Date
): number {
  const timeRange = end.getTime() - start.getTime();

  // Base tick density - one tick per 100px is generally readable
  const baseDensity = chartWidth / 100;

  // Adjust based on time range
  if (timeRange < 1000 * 60 * 60 * 2) {
    // < 2 hours
    return Math.max(4, Math.floor(baseDensity));
  } else if (timeRange < 1000 * 60 * 60 * 24) {
    // < 1 day
    return Math.max(4, Math.floor(baseDensity * 0.8));
  } else if (timeRange < 1000 * 60 * 60 * 24 * 7) {
    // < 1 week
    return Math.max(4, Math.floor(baseDensity * 0.7));
  } else {
    return Math.max(4, Math.floor(baseDensity * 0.6));
  }
}

/**
 * Gets appropriate time interval for chart ticks
 * @param start Start date of the data range
 * @param end End date of the data range
 * @returns The time interval in milliseconds
 */
export function getTimeIntervalForTicks(start: Date, end: Date): number {
  const timeRange = end.getTime() - start.getTime();

  if (timeRange < 1000 * 60 * 60 * 2) {
    // < 2 hours
    return 1000 * 60 * 15; // 15 minutes
  } else if (timeRange < 1000 * 60 * 60 * 24) {
    // < 1 day
    return 1000 * 60 * 60 * 2; // 2 hours
  } else if (timeRange < 1000 * 60 * 60 * 24 * 7) {
    // < 1 week
    return 1000 * 60 * 60 * 12; // 12 hours
  } else if (timeRange < 1000 * 60 * 60 * 24 * 30) {
    // < 1 month
    return 1000 * 60 * 60 * 24 * 2; // 2 days
  } else if (timeRange < 1000 * 60 * 60 * 24 * 90) {
    // < 3 months
    return 1000 * 60 * 60 * 24 * 7; // 1 week
  } else {
    return 1000 * 60 * 60 * 24 * 14; // 2 weeks
  }
}

/**
 * Creates a smart tooltip formatter for time values based on the time range
 * @param start Start date of the data range
 * @param end End date of the data range
 * @returns A formatter function for tooltips
 */
export function getTooltipTimeFormatter(start: Date, end: Date) {
  const timeRange = end.getTime() - start.getTime();

  return (value: string | number, name: any) => {
    const payload = name[0]?.payload;
    if (!payload?.time) return value;

    const date = new Date(payload.time);

    if (timeRange < 1000 * 60 * 60 * 24) {
      // For less than a day, show date and time with minutes
      return `${date.toLocaleDateString()}, ${date.toLocaleTimeString(
        undefined,
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;
    } else if (timeRange < 1000 * 60 * 60 * 24 * 7) {
      // For less than a week, show date and hour
      return `${date.toLocaleDateString()}, ${date.toLocaleTimeString(
        undefined,
        {
          hour: "2-digit",
        }
      )}`;
    } else if (timeRange < 1000 * 60 * 60 * 24 * 90) {
      // For less than 90 days, show date with month, day
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else {
      // For longer periods, show month and year
      return date.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });
    }
  };
}
