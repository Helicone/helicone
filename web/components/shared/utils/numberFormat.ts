import { formatWithSignificantFigures } from "./smartNumberFormat";

export function formatLargeNumber(value: number, roundLow?: boolean): string {
  if (value >= 1000) {
    return formatWithSignificantFigures(value, { 
      maxDecimalPlacesForLargeNumbers: 0,
      largeNumberThreshold: 1000
    });
  } else if (value >= 0.01) {
    return formatWithSignificantFigures(value);
  }

  if (roundLow) {
    return "0";
  }
  
  return formatWithSignificantFigures(value, { 
    maxSignificantFigures: 5,
    minSignificantFigures: 2
  });
}

