function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };

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

export function calculateProjection(
  values: number[],
  lastBarTimeProgress: number
): number {
  if (values.length < 2 || lastBarTimeProgress <= 0 || lastBarTimeProgress >= 1) {
    return 0;
  }

  const lastValue = values[values.length - 1];

  const previousValues = values.slice(0, -1);
  const { slope, intercept } = linearRegression(previousValues);

  const lastIndex = values.length - 1;
  const trendProjection = intercept + slope * lastIndex;

  const paceProjection = lastValue / lastBarTimeProgress;

  const projection = Math.max(trendProjection, paceProjection);

  const projectedAddition = Math.max(0, projection - lastValue);

  return projectedAddition;
}

export function calculateTimeProgress(
  lastTimestamp: string,
  timeframe: "24h" | "7d" | "30d" | "3m" | "1y"
): number {
  const now = new Date();
  const lastTime = new Date(lastTimestamp);

  let bucketSizeMs: number;
  switch (timeframe) {
    case "24h":
      bucketSizeMs = 60 * 60 * 1000;
      break;
    case "7d":
      bucketSizeMs = 24 * 60 * 60 * 1000;
      break;
    case "30d":
      bucketSizeMs = 24 * 60 * 60 * 1000;
      break;
    case "3m":
      bucketSizeMs = 7 * 24 * 60 * 60 * 1000;
      break;
    case "1y":
      bucketSizeMs = 7 * 24 * 60 * 60 * 1000;
      break;
    default:
      bucketSizeMs = 24 * 60 * 60 * 1000;
  }

  const timeSinceLastBucketStart = now.getTime() - lastTime.getTime();
  const progress = Math.min(1, Math.max(0, timeSinceLastBucketStart / bucketSizeMs));

  return progress;
}

