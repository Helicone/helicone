/**
 * Utility functions for calculating projections for bar charts.
 * Used to show projected values for the last/current time bucket.
 */

/**
 * Calculate linear regression slope and intercept for the given values.
 * Returns the predicted value at the next index position.
 */
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };

  // x values are indices: 0, 1, 2, ..., n-1
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: sumY / n };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate the projected value for the last bar based on trend analysis.
 *
 * Uses linear regression on previous data points to project the final value.
 * Since data has a 4-hour cache, pace-based projection will typically be behind,
 * so we default to trend trajectory and only use pace if it projects higher.
 *
 * @param values - Array of numeric values (one per time bucket)
 * @param lastBarTimeProgress - Progress through the last bucket (0-1, e.g., 0.5 = halfway)
 * @returns The projected additional value to add to the last bar (projection - current)
 */
export function calculateProjection(
  values: number[],
  lastBarTimeProgress: number
): number {
  if (values.length < 2 || lastBarTimeProgress <= 0 || lastBarTimeProgress >= 1) {
    return 0;
  }

  const lastValue = values[values.length - 1];

  // Linear regression on previous complete buckets (excluding partial last bucket)
  // This gives us the trend trajectory
  const previousValues = values.slice(0, -1);
  const { slope, intercept } = linearRegression(previousValues);

  // Project what this bucket should be based on trend
  const lastIndex = values.length - 1;
  const trendProjection = intercept + slope * lastIndex;

  // Pace-based projection: extrapolate current value based on time progress
  // Only use this if it's HIGHER than trend (since cached data is behind)
  const paceProjection = lastValue / lastBarTimeProgress;

  // Use trend as default, but take pace if it's higher
  const projection = Math.max(trendProjection, paceProjection);

  // The projection bar shows only the additional amount beyond current value
  const projectedAddition = Math.max(0, projection - lastValue);

  return projectedAddition;
}

/**
 * Calculate how far through the current time bucket we are.
 *
 * @param lastTimestamp - ISO timestamp of the last data point
 * @param timeframe - The timeframe being displayed ("24h" | "7d" | "30d" | "3m" | "1y")
 * @returns Progress through the current bucket (0-1)
 */
export function calculateTimeProgress(
  lastTimestamp: string,
  timeframe: "24h" | "7d" | "30d" | "3m" | "1y"
): number {
  const now = new Date();
  const lastTime = new Date(lastTimestamp);

  // Determine bucket size based on timeframe
  let bucketSizeMs: number;
  switch (timeframe) {
    case "24h":
      bucketSizeMs = 60 * 60 * 1000; // 1 hour
      break;
    case "7d":
      bucketSizeMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case "30d":
      bucketSizeMs = 24 * 60 * 60 * 1000; // 1 day
      break;
    case "3m":
      bucketSizeMs = 7 * 24 * 60 * 60 * 1000; // 1 week
      break;
    case "1y":
      bucketSizeMs = 7 * 24 * 60 * 60 * 1000; // 1 week
      break;
    default:
      bucketSizeMs = 24 * 60 * 60 * 1000; // Default to 1 day
  }

  // Calculate how far we are into the current bucket
  const timeSinceLastBucketStart = now.getTime() - lastTime.getTime();
  const progress = Math.min(1, Math.max(0, timeSinceLastBucketStart / bucketSizeMs));

  return progress;
}

/**
 * Check if we should show a projection for the given data.
 * Only show projections when:
 * 1. We have enough data points
 * 2. The last bucket is not yet complete
 *
 * @param dataLength - Number of data points
 * @param timeProgress - Progress through the last bucket (0-1)
 * @returns Whether to show projection
 */
export function shouldShowProjection(
  dataLength: number,
  timeProgress: number
): boolean {
  // Need at least 3 data points to make a reasonable projection
  if (dataLength < 3) {
    return false;
  }

  // Only show projection if we're not at the end of the bucket
  // and have made some progress (between 5% and 95%)
  return timeProgress > 0.05 && timeProgress < 0.95;
}
