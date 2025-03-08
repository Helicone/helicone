/**
 * Development optimizer - improves performance in development mode
 * by applying various optimizations
 */

// Config options
export const devOptimizationConfig = {
  // Disable expensive animations in development
  disableAnimations: true,
  // Limit the number of items rendered in lists
  maxListItems: 50,
  // Disable expensive calculations
  disableExpensiveCalculations: true,
  // Cache aggressively in development
  aggressiveCaching: true,
  // Skip validation in forms
  skipFormValidation: true,
};

// Check if we're in development mode
export const isDevelopment = process.env.NODE_ENV === "development";

// Check if we're in lightning mode - the fastest possible development experience
export const isLightningMode =
  typeof process !== "undefined" && process.env.DISABLE_API_CALLS === "true";

/**
 * Development optimization context for React components
 * Usage:
 * if (shouldOptimize('expensive-feature')) {
 *   // Skip or use simplified version
 * }
 */
export function shouldOptimize(featureName: string): boolean {
  if (!isDevelopment) return false;

  // Always optimize in lightning mode
  if (isLightningMode) return true;

  // Feature-specific optimizations
  switch (featureName) {
    case "animations":
      return devOptimizationConfig.disableAnimations;
    case "calculations":
      return devOptimizationConfig.disableExpensiveCalculations;
    case "validation":
      return devOptimizationConfig.skipFormValidation;
    default:
      return false;
  }
}

/**
 * Limit items in development mode to improve rendering performance
 */
export function limitItemsForDev<T>(items: T[], limit?: number): T[] {
  if (!isDevelopment) return items;
  return items.slice(0, limit || devOptimizationConfig.maxListItems);
}

/**
 * Add to your useEffect dependencies arrays to make them run less frequently in dev mode
 */
export const devDependency = isDevelopment
  ? Math.floor(Date.now() / 10000)
  : undefined;

// Apply optimizations immediately
if (isDevelopment && typeof window !== "undefined") {
  // Disable unnecessary browser features in development
  if (isLightningMode) {
    // Reduce console noise in lightning mode
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      // Filter out common development warnings
      const msg = args[0]?.toString() || "";
      if (
        msg.includes("deprecated") ||
        msg.includes("Warning:") ||
        msg.includes("Invalid prop")
      ) {
        return;
      }
      originalConsoleWarn(...args);
    };
  }
}
