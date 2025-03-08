/**
 * Development utilities for mocking API calls and heavy operations
 * This file is used only when DISABLE_API_CALLS=true is set
 */

// Check if we're in lightweight development mode
export const isLightweightMode =
  typeof process !== "undefined" && process.env.DISABLE_API_CALLS === "true";

// Sample mock data for dashboard
export const mockDashboardData = {
  metrics: {
    totalRequests: 12456,
    totalCost: 125.34,
    averageLatency: 234,
    userCount: 342,
  },
  requestsOverTime: Array(30)
    .fill(0)
    .map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      count: Math.floor(Math.random() * 500) + 100,
    })),
  topModels: [
    { name: "gpt-4", count: 5432, cost: 78.45 },
    { name: "gpt-3.5-turbo", count: 3245, cost: 12.34 },
    { name: "claude-2", count: 2341, cost: 23.45 },
    { name: "gpt-4-turbo", count: 1234, cost: 10.98 },
  ],
  countryData: [
    { country: "United States", count: 3456 },
    { country: "Germany", count: 1234 },
    { country: "United Kingdom", count: 987 },
    { country: "Canada", count: 876 },
    { country: "Australia", count: 765 },
  ],
};

// Sample mock data for requests
export const mockRequestsData = {
  requests: Array(50)
    .fill(0)
    .map((_, i) => ({
      id: `req-${i}-${Date.now()}`,
      model: ["gpt-4", "gpt-3.5-turbo", "claude-2", "gpt-4-turbo"][
        Math.floor(Math.random() * 4)
      ],
      promptTokens: Math.floor(Math.random() * 500) + 100,
      completionTokens: Math.floor(Math.random() * 1000) + 200,
      cost: (Math.random() * 0.5).toFixed(4),
      createdAt: new Date(
        Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
      ).toISOString(),
      status: ["success", "success", "success", "error"][
        Math.floor(Math.random() * 4)
      ],
      user: `user-${Math.floor(Math.random() * 10) + 1}@example.com`,
    })),
  totalCount: 1234,
  pageCount: 25,
};

// Helper function to simulate API delay but much faster than real API
export const simulateApiDelay = async () => {
  if (isLightweightMode) {
    // In lightweight mode, just add a minimal delay (50-150ms)
    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(Math.random() * 100) + 50)
    );
    return true;
  }
  return false;
};
