import { HELICONE_LOG_PRICING } from "../components/templates/pricing/requestLogTable";

export const handleLogCostCalculation = (currentLogValue: number) => {
  // calculate the estimated cost for the `currentValue` using tax brackets
  const calculateCost = (currentValue: number) => {
    let cost = 0;
    let remainingValue = currentValue;
    for (const pricing of HELICONE_LOG_PRICING) {
      const logCount = Math.min(pricing.upper - pricing.lower, remainingValue);
      cost += logCount * pricing.rate;
      remainingValue -= logCount;
      if (remainingValue <= 0) {
        break;
      }
    }
    return cost;
  };

  return calculateCost(currentLogValue);
};
