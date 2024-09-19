import { HELICONE_LOG_PRICING } from "@/components/templates/pricing/requestLogTable";

const handleLogCostCalculation = (currentLogValue: number) => {
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

export const renderLogCost = (requestLogs: number) => {
  if (requestLogs <= 10_000) {
    return "$0.00";
  }
  if (requestLogs >= 50_000_000) {
    return "Contact us for pricing";
  }

  return new Intl.NumberFormat("us", {
    style: "currency",
    currency: "USD",
  }).format(handleLogCostCalculation(requestLogs));
};
