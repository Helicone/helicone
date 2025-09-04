/**
 * Formats a number with appropriate significant figures based on its magnitude
 * 
 * @param value The number to format
 * @param options Configuration options for formatting
 * @returns Formatted number as a string
 */
export function formatWithSignificantFigures(
  value: number,
  options: {
    /** Minimum number of significant figures to display (default: 3) */
    minSignificantFigures?: number;
    /** Maximum number of significant figures to display (default: 4) */
    maxSignificantFigures?: number;
    /** Maximum number of decimal places for large numbers (default: 0) */
    maxDecimalPlacesForLargeNumbers?: number;
    /** Threshold above which a number is considered "large" (default: 1000) */
    largeNumberThreshold?: number;
    /** Whether to include currency symbol ($) for cost values (default: false) */
    isCurrency?: boolean;
    /** Unit to append to the formatted number (e.g., "ms", "s", "tokens") */
    unit?: string;
  } = {}
): string {
  // Default options
  const {
    minSignificantFigures = 3,
    maxSignificantFigures = 4,
    maxDecimalPlacesForLargeNumbers = 0,
    largeNumberThreshold = 1000,
    isCurrency = false,
    unit = "",
  } = options;

  // Handle special cases
  if (value === 0) return isCurrency ? "$0" : "0" + (unit ? ` ${unit}` : "");
  if (isNaN(value)) return "N/A";
  
  let formattedValue: string;
  const absValue = Math.abs(value);

  // For large numbers, use fewer decimal places
  if (absValue >= largeNumberThreshold) {
    formattedValue = value.toLocaleString("en-US", {
      maximumFractionDigits: maxDecimalPlacesForLargeNumbers,
      minimumFractionDigits: 0,
    });
  } 
  // For medium numbers (between 0.01 and largeNumberThreshold)
  else if (absValue >= 0.01) {
    formattedValue = value.toLocaleString("en-US", {
      maximumSignificantDigits: maxSignificantFigures,
      minimumSignificantDigits: minSignificantFigures,
    });
  } 
  // For very small numbers, use scientific notation or fixed precision
  else {
    // Find the number of leading zeros after the decimal point
    const strValue = absValue.toString();
    const decimalMatch = strValue.match(/0\.0*/);
    const leadingZeros = decimalMatch ? decimalMatch[0].length - 2 : 0;
    
    // Use enough decimal places to show significant digits
    const decimalPlaces = leadingZeros + maxSignificantFigures;
    formattedValue = value.toFixed(decimalPlaces);
    
    // Remove trailing zeros
    formattedValue = formattedValue.replace(/\.?0+$/, "");
  }

  // Add currency symbol if needed
  if (isCurrency) {
    formattedValue = "$" + formattedValue;
  }

  // Add unit if provided
  if (unit) {
    formattedValue += ` ${unit}`;
  }

  return formattedValue;
}

/**
 * Formats time values (in milliseconds) with appropriate units and precision
 * 
 * @param ms Time in milliseconds
 * @returns Formatted time string with appropriate units
 */
export function formatTimeValue(ms: number): string {
  if (isNaN(ms) || ms === 0) return "0 ms";
  
  const absMs = Math.abs(ms);
  
  // Use appropriate time units based on magnitude
  if (absMs < 1) {
    // Microseconds
    return formatWithSignificantFigures(ms * 1000, { unit: "μs" });
  } else if (absMs < 1000) {
    // Milliseconds
    return formatWithSignificantFigures(ms, { unit: "ms" });
  } else if (absMs < 60000) {
    // Seconds (less than a minute)
    return formatWithSignificantFigures(ms / 1000, { unit: "s" });
  } else if (absMs < 3600000) {
    // Minutes (less than an hour)
    return formatWithSignificantFigures(ms / 60000, { unit: "min" });
  } else if (absMs < 86400000) {
    // Hours (less than a day)
    return formatWithSignificantFigures(ms / 3600000, { unit: "h" });
  } else {
    // Days
    return formatWithSignificantFigures(ms / 86400000, { unit: "d" });
  }
}

/**
 * Formats token counts with appropriate precision
 * 
 * @param tokens Number of tokens
 * @returns Formatted token count
 */
export function formatTokenCount(tokens: number): string {
  if (isNaN(tokens) || tokens === 0) return "0 tokens";
  
  // For large token counts, use K/M/B suffixes
  if (tokens >= 1_000_000_000) {
    return formatWithSignificantFigures(tokens / 1_000_000_000, { unit: "B tokens" });
  } else if (tokens >= 1_000_000) {
    return formatWithSignificantFigures(tokens / 1_000_000, { unit: "M tokens" });
  } else if (tokens >= 1_000) {
    return formatWithSignificantFigures(tokens / 1_000, { unit: "K tokens" });
  } else {
    return formatWithSignificantFigures(tokens, { unit: "tokens" });
  }
}

/**
 * Formats cost values with appropriate precision
 * 
 * @param cost Cost value
 * @returns Formatted cost string
 */
export function formatCost(cost: number): string {
  return formatWithSignificantFigures(cost, { isCurrency: true });
}

