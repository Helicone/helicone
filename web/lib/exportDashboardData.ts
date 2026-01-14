import * as XLSX from "xlsx";
import { Result } from "@/packages/common/result";
import { RequestsOverTime } from "@/lib/timeCalculations/fetchTimeData";

// Types for dashboard export - defined locally to avoid dependency on legacy API files
export interface CostOverTime {
  cost: number;
  time: Date;
}

export interface ErrorOverTime {
  count: number;
  time: Date;
}

export interface TokensOverTime {
  prompt_tokens: number;
  completion_tokens: number;
  time: Date;
}

export interface LatencyOverTime {
  duration: number;
  time: Date;
}

export interface ThreatsOverTime {
  count: number;
  time: Date;
}

export interface TimeToFirstToken {
  ttft: number;
  time: Date;
}

export interface UsersOverTime {
  count: number;
  time: Date;
}

export interface TokensPerRequest {
  average_prompt_tokens_per_response: number;
  average_completion_tokens_per_response: number;
  average_total_tokens_per_response: number;
}

export interface DashboardExportData {
  metrics: {
    totalCost: { data: Result<number, string> | undefined };
    totalRequests: { data: Result<number, string> | undefined };
    averageLatency: { data: Result<number, string> | undefined };
    averageTokensPerRequest: {
      data: Result<TokensPerRequest, string> | undefined;
    };
    activeUsers: { data: Result<number, string> | undefined };
    averageTimeToFirstToken: { data: Result<number, string> | undefined };
    totalThreats: { data: Result<number, string> | undefined };
  };
  overTimeData: {
    requests: { data: Result<RequestsOverTime[], string> | undefined };
    requestsWithStatus: {
      data:
        | Result<(RequestsOverTime & { status: number })[], string>
        | undefined;
    };
    costs: { data: Result<CostOverTime[], string> | undefined };
    latency: { data: Result<LatencyOverTime[], string> | undefined };
    users: { data: Result<UsersOverTime[], string> | undefined };
    timeToFirstToken: { data: Result<TimeToFirstToken[], string> | undefined };
    threats: { data: Result<ThreatsOverTime[], string> | undefined };
    errors: { data: Result<ErrorOverTime[], string> | undefined };
    promptTokensOverTime: {
      data: Result<TokensOverTime[], string> | undefined;
    };
  };
  models: Result<
    Array<{
      id?: string;
      model: string;
      total_requests: number;
      total_completion_tokens: number;
      total_prompt_token: number;
      total_tokens: number;
      cost: number;
    }>,
    unknown
  >;
  providers: Result<
    Array<{
      provider: string;
      total_requests: number;
    }>,
    unknown
  >;
}

/**
 * Converts dashboard data to an Excel file with multiple sheets
 */
export async function exportDashboardToExcel(
  data: DashboardExportData,
  timeFilter: { start: Date; end: Date },
): Promise<Blob> {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // 1. Export summary metrics
  const summaryMetrics = [
    {
      metric: "Total Cost",
      value:
        data.metrics.totalCost.data?.data !== undefined
          ? data.metrics.totalCost.data.data
          : "N/A",
    },
    {
      metric: "Total Requests",
      value:
        data.metrics.totalRequests.data?.data !== undefined
          ? data.metrics.totalRequests.data.data
          : "N/A",
    },
    {
      metric: "Average Latency (ms)",
      value:
        data.metrics.averageLatency.data?.data !== undefined
          ? data.metrics.averageLatency.data.data
          : "N/A",
    },
    {
      metric: "Average Prompt Tokens",
      value:
        data.metrics.averageTokensPerRequest.data?.data
          ?.average_prompt_tokens_per_response !== undefined
          ? data.metrics.averageTokensPerRequest.data.data
              .average_prompt_tokens_per_response
          : "N/A",
    },
    {
      metric: "Average Completion Tokens",
      value:
        data.metrics.averageTokensPerRequest.data?.data
          ?.average_completion_tokens_per_response !== undefined
          ? data.metrics.averageTokensPerRequest.data.data
              .average_completion_tokens_per_response
          : "N/A",
    },
    {
      metric: "Average Total Tokens",
      value:
        data.metrics.averageTokensPerRequest.data?.data
          ?.average_total_tokens_per_response !== undefined
          ? data.metrics.averageTokensPerRequest.data.data
              .average_total_tokens_per_response
          : "N/A",
    },
    {
      metric: "Active Users",
      value:
        data.metrics.activeUsers.data?.data !== undefined
          ? data.metrics.activeUsers.data.data
          : "N/A",
    },
    {
      metric: "Average Time to First Token (ms)",
      value:
        data.metrics.averageTimeToFirstToken.data?.data !== undefined
          ? data.metrics.averageTimeToFirstToken.data.data
          : "N/A",
    },
    {
      metric: "Total Threats",
      value:
        data.metrics.totalThreats.data?.data !== undefined
          ? data.metrics.totalThreats.data.data
          : "N/A",
    },
    {
      metric: "Time Range Start",
      value: timeFilter.start.toISOString(),
    },
    {
      metric: "Time Range End",
      value: timeFilter.end.toISOString(),
    },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryMetrics);
  // Auto-size columns
  summarySheet["!cols"] = [{ wch: 30 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // 2. Export requests over time
  if (data.overTimeData.requests.data?.data) {
    const requestsData = data.overTimeData.requests.data.data.map((r) => ({
      timestamp: r.time.toISOString(),
      count: r.count,
    }));
    const requestsSheet = XLSX.utils.json_to_sheet(requestsData);
    requestsSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, requestsSheet, "Requests");
  }

  // 3. Export requests with status over time
  if (data.overTimeData.requestsWithStatus.data?.data) {
    const requestsWithStatusData =
      data.overTimeData.requestsWithStatus.data.data.map((r) => ({
        timestamp: r.time.toISOString(),
        count: r.count,
        status: r.status,
      }));
    const requestsStatusSheet = XLSX.utils.json_to_sheet(
      requestsWithStatusData,
    );
    requestsStatusSheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(
      workbook,
      requestsStatusSheet,
      "Requests by Status",
    );
  }

  // 4. Export costs over time
  if (data.overTimeData.costs.data?.data) {
    const costsData = data.overTimeData.costs.data.data.map((c) => ({
      timestamp: c.time.toISOString(),
      cost: c.cost,
    }));
    const costsSheet = XLSX.utils.json_to_sheet(costsData);
    costsSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, costsSheet, "Costs");
  }

  // 5. Export latency over time
  if (data.overTimeData.latency.data?.data) {
    const latencyData = data.overTimeData.latency.data.data.map((l) => ({
      timestamp: l.time.toISOString(),
      duration_ms: l.duration,
    }));
    const latencySheet = XLSX.utils.json_to_sheet(latencyData);
    latencySheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, latencySheet, "Latency");
  }

  // 6. Export users over time
  if (data.overTimeData.users.data?.data) {
    const usersData = data.overTimeData.users.data.data.map((u) => ({
      timestamp: u.time.toISOString(),
      count: u.count,
    }));
    const usersSheet = XLSX.utils.json_to_sheet(usersData);
    usersSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, usersSheet, "Users");
  }

  // 7. Export time to first token over time
  if (data.overTimeData.timeToFirstToken.data?.data) {
    const ttftData = data.overTimeData.timeToFirstToken.data.data.map((t) => ({
      timestamp: t.time.toISOString(),
      ttft_ms: t.ttft,
    }));
    const ttftSheet = XLSX.utils.json_to_sheet(ttftData);
    ttftSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, ttftSheet, "Time to First Token");
  }

  // 8. Export threats over time
  if (data.overTimeData.threats.data?.data) {
    const threatsData = data.overTimeData.threats.data.data.map((t) => ({
      timestamp: t.time.toISOString(),
      count: t.count,
    }));
    const threatsSheet = XLSX.utils.json_to_sheet(threatsData);
    threatsSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, threatsSheet, "Threats");
  }

  // 9. Export errors over time
  if (data.overTimeData.errors.data?.data) {
    const errorsData = data.overTimeData.errors.data.data.map((e) => ({
      timestamp: e.time.toISOString(),
      count: e.count,
    }));
    const errorsSheet = XLSX.utils.json_to_sheet(errorsData);
    errorsSheet["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, errorsSheet, "Errors");
  }

  // 10. Export tokens over time
  if (data.overTimeData.promptTokensOverTime.data?.data) {
    const tokensData = data.overTimeData.promptTokensOverTime.data.data.map(
      (t) => ({
        timestamp: t.time.toISOString(),
        prompt_tokens: t.prompt_tokens,
        completion_tokens: t.completion_tokens,
        total_tokens: t.prompt_tokens + t.completion_tokens,
      }),
    );
    const tokensSheet = XLSX.utils.json_to_sheet(tokensData);
    tokensSheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, tokensSheet, "Tokens");
  }

  // 11. Export top models
  if (data.models.data && Array.isArray(data.models.data)) {
    const modelsData = data.models.data.map((m) => ({
      model: m.model,
      total_requests: m.total_requests,
      total_completion_tokens: m.total_completion_tokens,
      total_prompt_tokens: m.total_prompt_token,
      total_tokens: m.total_tokens,
      cost: m.cost,
    }));
    const modelsSheet = XLSX.utils.json_to_sheet(modelsData);
    modelsSheet["!cols"] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 22 },
      { wch: 18 },
      { wch: 15 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, modelsSheet, "Top Models");
  }

  // 12. Export top providers
  if (data.providers.data && Array.isArray(data.providers.data)) {
    const providersData = data.providers.data.map((p) => ({
      provider: p.provider,
      total_requests: p.total_requests,
    }));
    const providersSheet = XLSX.utils.json_to_sheet(providersData);
    providersSheet["!cols"] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, providersSheet, "Top Providers");
  }

  // Generate the Excel file as a blob
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
