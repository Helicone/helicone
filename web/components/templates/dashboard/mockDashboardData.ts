/**
 * This file contains mock data for the dashboard page when a user hasn't onboarded.
 * Used to provide a preview of what the dashboard looks like with data.
 */

import { Result } from "@/packages/common/result";
import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";
import { ModelMetric } from "@/services/hooks/models";
import { SingleFilterDef } from "@helicone-package/filters/frontendFilterDefs";

// Mock metrics data
export const getMockMetrics = () => ({
  totalCost: {
    data: { data: 3486.78, error: null } as Result<number, string>,
    isLoading: false,
  },
  totalRequests: {
    data: { data: 10933743, error: null } as Result<number, string>,
    isLoading: false,
  },
  averageLatency: {
    data: { data: 1245, error: null } as Result<number, string>,
    isLoading: false,
  },
  averageTokensPerRequest: {
    data: {
      data: {
        average_prompt_tokens_per_response: 262.868,
        average_completion_tokens_per_response: 95.047,
        average_total_tokens_per_response: 357.914,
      },
      error: null,
    },
    isLoading: false,
  },
  activeUsers: {
    data: { data: 8918, error: null } as Result<number, string>,
    isLoading: false,
  },
  averageTimeToFirstToken: {
    data: { data: 325, error: null } as Result<number, string>,
    isLoading: false,
  },
  totalThreats: {
    data: { data: 19, error: null } as Result<number, string>,
    isLoading: false,
  },
});

// Mock top countries data
export const getMockCountries = () => ({
  data: [
    {
      country: "US",
      total_requests: 6823459,
    },
    {
      country: "GB",
      total_requests: 1254678,
    },
    {
      country: "IN",
      total_requests: 874321,
    },
    {
      country: "DE",
      total_requests: 582614,
    },
    {
      country: "CA",
      total_requests: 491873,
    },
    {
      country: "JP",
      total_requests: 323567,
    },
    {
      country: "AU",
      total_requests: 247891,
    },
    {
      country: "FR",
      total_requests: 215478,
    },
    {
      country: "BR",
      total_requests: 183642,
    },
    {
      country: "SG",
      total_requests: 167520,
    },
  ],
  error: null,
});

// Mock scores data for the scores panel
export const getMockScoresOverTimeData = () => ({
  data: Array(30)
    .fill(0)
    .map((_, i) => ({
      time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      score: Math.random() * 4 + 1, // Score between 1-5
    })),
  error: null,
});

// Mock boolean scores data for the boolean scores panel
export const getMockBooleanScoresOverTimeData = () => ({
  data: Array(30)
    .fill(0)
    .map((_, i) => ({
      time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      positive_percentage: Math.random() * 40 + 60, // Between 60-100%
    })),
  error: null,
});

// Mock quantiles data for the quantiles graph
export const getMockQuantiles = (metric: string = "latency") => {
  // Generate different ranges based on metric type
  const getRange = () => {
    if (metric === "latency") {
      return { min: 500, max: 2000 }; // 500ms-2000ms
    } else if (metric === "prompt_tokens") {
      return { min: 100, max: 500 }; // 100-500 tokens
    } else if (metric === "completion_tokens") {
      return { min: 50, max: 300 }; // 50-300 tokens
    } else {
      return { min: 150, max: 800 }; // 150-800 tokens (total)
    }
  };

  const range = getRange();

  return {
    data: Array(30)
      .fill(0)
      .map((_, i) => {
        const p75 = Math.random() * (range.max * 0.6 - range.min) + range.min;
        const p90 = p75 + Math.random() * (range.max * 0.8 - p75);
        const p95 = p90 + Math.random() * (range.max * 0.9 - p90);
        const p99 = p95 + Math.random() * (range.max - p95);

        return {
          time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
          p75,
          p90,
          p95,
          p99,
        };
      }),
    error: null,
  };
};

// Mock requests over time data
export const getMockRequestsOverTime = () => ({
  data: Array(30)
    .fill(0)
    .map((_, i) => ({
      time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      count: Math.floor(Math.random() * 800000 + 200000), // Between 200k-1M requests
      status: null,
    })),
  error: null,
});

// Mock errors over time data
export const getMockErrorsOverTime = () => ({
  data: Array(30)
    .fill(0)
    .map((_, i) => ({
      time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      count: Math.floor(Math.random() * 5000 + 200), // Between 200-5200 errors
      status: null,
    })),
  error: null,
});

// Mock request status data
export const getMockRequestStatusOverTime = () => {
  // Generate status data for each day (30 days)
  const statusData = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000);

    // Success requests (200)
    const successCount = Math.floor(Math.random() * 800000 + 200000);
    statusData.push({
      time: date,
      count: successCount,
      status: 200,
    });

    // 400 errors
    statusData.push({
      time: date,
      count: Math.floor(Math.random() * 500 + 100),
      status: 400,
    });

    // 404 errors
    statusData.push({
      time: date,
      count: Math.floor(Math.random() * 100 + 10),
      status: 404,
    });

    // 500 errors
    statusData.push({
      time: date,
      count: Math.floor(Math.random() * 50 + 5),
      status: 500,
    });

    // Cancelled (-3)
    statusData.push({
      time: date,
      count: Math.floor(Math.random() * 30 + 5),
      status: -3,
    });
  }

  return {
    data: statusData,
    error: null,
  };
};

// Mock models data
export const getMockModels = () => ({
  data: [
    {
      model: "text-embedding-3-large",
      total_requests: 8973385,
      total_completion_tokens: 0,
      total_prompt_token: 320143692,
      total_tokens: 320143692,
      cost: 41.61867996,
    },
    {
      model: "vector_db",
      total_requests: 775837,
      total_completion_tokens: 0,
      total_prompt_token: 0,
      total_tokens: 0,
      cost: 0,
    },
    {
      model: "claude-3-5-sonnet-20241022",
      total_requests: 593421,
      total_completion_tokens: 179841562,
      total_prompt_token: 9983824237,
      total_tokens: 10163665799,
      cost: 32649.096141,
    },
    {
      model: "gpt-4o-mini-2024-07-18",
      total_requests: 380341,
      total_completion_tokens: 265144737,
      total_prompt_token: 15776386060,
      total_tokens: 16041530797,
      cost: 2525.5447512,
    },
    {
      model: "claude-3-7-sonnet-20250219",
      total_requests: 176668,
      total_completion_tokens: 39351846,
      total_prompt_token: 2517220428,
      total_tokens: 2556572274,
      cost: 8141.938974,
    },
    {
      model: "gpt-4o-mini",
      total_requests: 13835,
      total_completion_tokens: 0,
      total_prompt_token: 0,
      total_tokens: 0,
      cost: 0,
    },
    {
      model: "o3-mini-2025-01-31",
      total_requests: 9587,
      total_completion_tokens: 7780300,
      total_prompt_token: 134553863,
      total_tokens: 142334163,
      cost: 182.2425693,
    },
    {
      model: "o1-2024-12-17",
      total_requests: 7043,
      total_completion_tokens: 8545912,
      total_prompt_token: 188124225,
      total_tokens: 196670137,
      cost: 3334.618095,
    },
  ] as ModelMetric[],
  error: null,
});

// Generate mock data for various over time metrics
export const getMockOverTimeData = (timeIncrement: TimeIncrement) => {
  return {
    requests: {
      data: getMockRequestsOverTime(),
      isLoading: false,
      refetch: () => {},
      remove: () => {},
    },
    requestsWithStatus: {
      data: getMockRequestStatusOverTime(),
      isLoading: false,
      refetch: () => {},
      remove: () => {},
    },
    errors: {
      data: getMockErrorsOverTime(),
      isLoading: false,
      refetch: () => {},
      remove: () => {},
    },
    costs: {
      data: {
        data: Array(30)
          .fill(0)
          .map((_, i) => ({
            time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
            cost: Math.random() * 200 + 50,
          })),
        error: null,
      },
      isLoading: false,
      refetch: () => {},
      remove: () => {},
    },
    users: {
      data: {
        data: Array(30)
          .fill(0)
          .map((_, i) => ({
            time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
            count: Math.floor(Math.random() * 300 + 100),
          })),
        error: null,
      },
      isLoading: false,
      refetch: () => {},
      remove: () => {},
    },
    latency: {
      data: {
        data: Array(30)
          .fill(0)
          .map((_, i) => ({
            time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
            duration: Math.random() * 2000 + 500,
          })),
        error: null,
      },
      isLoading: false,
      refetch: () => {},
      remove: () => {},
    },
    timeToFirstToken: {
      data: {
        data: Array(30)
          .fill(0)
          .map((_, i) => ({
            time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
            ttft: Math.random() * 400 + 200,
          })),
        error: null,
      },
      isLoading: false,
      refetch: () => {},
      remove: () => {},
    },
    threats: {
      data: {
        data: Array(30)
          .fill(0)
          .map((_, i) => ({
            time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
            count: Math.floor(Math.random() * 5),
          })),
        error: null,
      },
      isLoading: false,
      refetch: () => {},
      remove: () => {},
    },
    promptTokensOverTime: {
      data: {
        data: Array(30)
          .fill(0)
          .map((_, i) => ({
            time: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
            prompt_tokens: Math.floor(Math.random() * 1000000 + 500000),
            completion_tokens: Math.floor(Math.random() * 500000 + 100000),
          })),
        error: null,
      },
      isLoading: false,
      refetch: () => {},
      remove: () => {},
    },
  };
};

// Mock filter map data
export const getMockFilterMap = () => {
  return [
    {
      label: "Status",
      operators: [
        { label: "equals", value: "=" },
        { label: "not equals", value: "!=" },
      ],
      table: "request_response_rmt",
      column: "status",
      category: "request",
    },
    {
      label: "Model",
      operators: [
        { label: "equals", value: "=" },
        { label: "not equals", value: "!=" },
        { label: "contains", value: "LIKE" },
        { label: "not contains", value: "NOT LIKE" },
      ],
      table: "request_response_rmt",
      column: "model",
      category: "request",
    },
    {
      label: "User",
      operators: [
        { label: "equals", value: "=" },
        { label: "not equals", value: "!=" },
        { label: "contains", value: "LIKE" },
        { label: "not contains", value: "NOT LIKE" },
      ],
      table: "request_response_rmt",
      column: "user_id",
      category: "request",
    },
    {
      label: "Latency",
      operators: [
        { label: "equals", value: "=" },
        { label: "not equals", value: "!=" },
        { label: "greater than", value: ">" },
        { label: "less than", value: "<" },
      ],
      table: "request_response_rmt",
      column: "latency",
      category: "request",
    },
  ] as SingleFilterDef<any>[];
};
