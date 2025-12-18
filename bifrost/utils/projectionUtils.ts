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
 * Uses linear regression on previous data points to project the final value.
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

  // If no progress has been made, we can't project
  if (lastBarTimeProgress === 0) {
    return 0;
  }

  // Method 1: Simple extrapolation based on current progress
  // If we're 50% through the bucket and have 100 tokens, project 200 total
  const simpleProjection = lastValue / lastBarTimeProgress;

  // Method 2: Linear regression on ALL values (including partial last bucket)
  // This captures the trend and projects where we should be
  const { slope, intercept } = linearRegression(values);
  const lastIndex = values.length - 1;
  // Project what the full bucket value should be based on trend
  const trendProjection = intercept + slope * lastIndex;

  // Method 3: For the last bar specifically, use the trend to predict what
  // the full value should be, but also consider current pace
  // If the current pace (simple projection) is higher than trend, use a blend
  // that favors the higher value (optimistic but grounded)

  // Weight: favor simple projection more as we have more data in the current bucket
  // At 50% progress, give equal weight. At 90% progress, heavily favor simple.
  const simpleWeight = Math.min(lastBarTimeProgress * 1.2, 0.95);

  // Take the maximum of trend and simple, then blend slightly toward the other
  // This ensures we don't underproject when there's clear growth
  const maxProjection = Math.max(simpleProjection, trendProjection);
  const minProjection = Math.min(simpleProjection, trendProjection);

  // Blend: mostly use the higher projection, but pull slightly toward the lower
  // to avoid being overly optimistic
  const blendedProjection = maxProjection * 0.85 + minProjection * 0.15;

  // The projection bar should only show the additional projected amount
  const projectedAddition = Math.max(0, blendedProjection - lastValue);

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
