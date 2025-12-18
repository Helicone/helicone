/**
 * Utility functions for calculating projections for bar charts.
 * Used to show projected values for the last/current time bucket.
 */

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

  // Method 1: Simple projection based on current progress
  // If we're 50% through the bucket and have 100 tokens, project 200 total
  const simpleProjection = lastValue / lastBarTimeProgress;

  // Method 2: Use average of previous buckets as a baseline
  // This helps smooth out projections when current bucket is anomalous
  const previousValues = values.slice(0, -1);
  const previousAverage =
    previousValues.reduce((sum, v) => sum + v, 0) / previousValues.length;

  // Blend the two methods:
  // - Weight the simple projection more when we have more progress data
  // - Weight the historical average more when we're early in the bucket
  const progressWeight = Math.min(lastBarTimeProgress * 1.5, 0.8);
  const blendedProjection =
    simpleProjection * progressWeight + previousAverage * (1 - progressWeight);

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
