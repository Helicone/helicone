export interface HqlColumn {
  name: string;
  type: "datetime" | "numeric" | "categorical" | "boolean";
  isId?: boolean;
  isToken?: boolean;
  isCost?: boolean;
  isLatency?: boolean;
  isStatus?: boolean;
  isGeographic?: boolean;
}

export interface ChartSuggestion {
  type: string;
  title: string;
  description: string;
  xAxis: string;
  yAxis: string;
  aggregation?: "sum" | "avg" | "count" | "max" | "min";
  priority: number;
  category: "performance" | "cost" | "usage" | "errors" | "geographic";
}

// Known HQL column patterns
const COLUMN_PATTERNS = {
  datetime: [
    "response_created_at",
    "request_created_at",
    "updated_at",
    "created_at",
    "timestamp",
  ],
  token: [
    "completion_tokens",
    "prompt_tokens",
    "completion_audio_tokens",
    "prompt_cache_write_tokens",
    "prompt_cache_read_tokens",
    "prompt_audio_tokens",
  ],
  cost: ["cost"],
  latency: ["latency", "time_to_first_token"],
  status: ["status", "threat"],
  geographic: ["country_code"],
  boolean: ["is_passthrough_billing", "cache_enabled"],
  id: [
    "response_id",
    "request_id",
    "user_id",
    "organization_id",
    "proxy_key_id",
    "cache_reference_id",
    "prompt_id",
  ],
};

export function analyzeHqlColumns(
  data: Array<Record<string, any>>,
): HqlColumn[] {
  if (!data.length) return [];

  const columns = Object.keys(data[0]);

  return columns.map((col) => {
    const colLower = col.toLowerCase();
    const sampleValues = data
      .slice(0, 10)
      .map((row) => row[col])
      .filter((val) => val !== null && val !== undefined);

    let type: HqlColumn["type"] = "categorical";

    // Check for datetime columns
    if (
      COLUMN_PATTERNS.datetime.some((pattern) => colLower.includes(pattern))
    ) {
      type = "datetime";
    }
    // Check for numeric columns
    else if (
      sampleValues.every((val) => !isNaN(Number(val)) && isFinite(Number(val)))
    ) {
      type = "numeric";
    }
    // Check for boolean columns
    else if (
      COLUMN_PATTERNS.boolean.some((pattern) => colLower === pattern) ||
      sampleValues.every(
        (val) =>
          typeof val === "boolean" ||
          val === "true" ||
          val === "false" ||
          val === 0 ||
          val === 1,
      )
    ) {
      type = "boolean";
    }

    return {
      name: col,
      type,
      isId: COLUMN_PATTERNS.id.some((pattern) => colLower.includes(pattern)),
      isToken: COLUMN_PATTERNS.token.some((pattern) => colLower === pattern),
      isCost: COLUMN_PATTERNS.cost.some((pattern) => colLower === pattern),
      isLatency: COLUMN_PATTERNS.latency.some(
        (pattern) => colLower === pattern,
      ),
      isStatus: COLUMN_PATTERNS.status.some((pattern) => colLower === pattern),
      isGeographic: COLUMN_PATTERNS.geographic.some(
        (pattern) => colLower === pattern,
      ),
    };
  });
}

export function generateChartSuggestions(
  columns: HqlColumn[],
): ChartSuggestion[] {
  const suggestions: ChartSuggestion[] = [];

  const datetimeColumns = columns.filter((c) => c.type === "datetime");
  const numericColumns = columns.filter((c) => c.type === "numeric");
  const tokenColumns = columns.filter((c) => c.isToken);
  const costColumns = columns.filter((c) => c.isCost);
  const latencyColumns = columns.filter((c) => c.isLatency);
  const statusColumns = columns.filter((c) => c.isStatus);
  const geoColumns = columns.filter((c) => c.isGeographic);
  const categoricalColumns = columns.filter(
    (c) => c.type === "categorical" && !c.isId,
  );

  // Performance monitoring suggestions
  if (datetimeColumns.length > 0 && latencyColumns.length > 0) {
    suggestions.push({
      type: "line",
      title: "Latency Over Time",
      description: "Track API response latency trends",
      xAxis: datetimeColumns[0].name,
      yAxis: latencyColumns[0].name,
      aggregation: "avg",
      priority: 10,
      category: "performance",
    });
  }

  if (
    datetimeColumns.length > 0 &&
    columns.some((c) => c.name === "time_to_first_token")
  ) {
    suggestions.push({
      type: "line",
      title: "Time to First Token Trends",
      description: "Monitor streaming performance over time",
      xAxis: datetimeColumns[0].name,
      yAxis: "time_to_first_token",
      aggregation: "avg",
      priority: 9,
      category: "performance",
    });
  }

  // Cost analysis suggestions
  if (datetimeColumns.length > 0 && costColumns.length > 0) {
    suggestions.push({
      type: "line",
      title: "Cost Over Time",
      description: "Track spending trends",
      xAxis: datetimeColumns[0].name,
      yAxis: costColumns[0].name,
      aggregation: "sum",
      priority: 9,
      category: "cost",
    });
  }

  if (costColumns.length > 0) {
    suggestions.push({
      type: "histogram",
      title: "Cost Distribution",
      description: "Analyze cost per request distribution",
      xAxis: costColumns[0].name,
      yAxis: "count",
      priority: 7,
      category: "cost",
    });
  }

  // Token usage analysis
  if (datetimeColumns.length > 0 && tokenColumns.length > 0) {
    suggestions.push({
      type: "multi-line",
      title: "Token Usage Over Time",
      description: "Track prompt and completion token usage",
      xAxis: datetimeColumns[0].name,
      yAxis: tokenColumns.map((c) => c.name).join(","),
      aggregation: "sum",
      priority: 8,
      category: "usage",
    });
  }

  if (tokenColumns.length >= 2) {
    const promptTokens = tokenColumns.find((c) => c.name.includes("prompt"));
    const completionTokens = tokenColumns.find((c) =>
      c.name.includes("completion"),
    );
    if (promptTokens && completionTokens) {
      suggestions.push({
        type: "scatter",
        title: "Prompt vs Completion Tokens",
        description: "Analyze token usage relationship",
        xAxis: promptTokens.name,
        yAxis: completionTokens.name,
        priority: 6,
        category: "usage",
      });
    }
  }

  // Model/Provider analysis
  if (columns.some((c) => c.name === "model") && numericColumns.length > 0) {
    const performanceMetric =
      latencyColumns[0] || costColumns[0] || numericColumns[0];
    suggestions.push({
      type: "bar",
      title: `${performanceMetric.name.charAt(0).toUpperCase() + performanceMetric.name.slice(1)} by Model`,
      description: `Compare ${performanceMetric.name} across different models`,
      xAxis: "model",
      yAxis: performanceMetric.name,
      aggregation: "avg",
      priority: 8,
      category: performanceMetric.isCost ? "cost" : "performance",
    });
  }

  if (columns.some((c) => c.name === "provider") && numericColumns.length > 0) {
    const metric = costColumns[0] || latencyColumns[0] || numericColumns[0];
    suggestions.push({
      type: "bar",
      title: `${metric.name.charAt(0).toUpperCase() + metric.name.slice(1)} by Provider`,
      description: `Compare ${metric.name} across providers`,
      xAxis: "provider",
      yAxis: metric.name,
      aggregation: "avg",
      priority: 7,
      category: metric.isCost ? "cost" : "performance",
    });
  }

  // Error analysis
  if (statusColumns.length > 0) {
    suggestions.push({
      type: "pie",
      title: "Status Code Distribution",
      description: "Analyze response status patterns",
      xAxis: statusColumns[0].name,
      yAxis: "count",
      priority: 7,
      category: "errors",
    });
  }

  if (datetimeColumns.length > 0 && statusColumns.length > 0) {
    suggestions.push({
      type: "stacked-bar",
      title: "Status Codes Over Time",
      description: "Track error rates over time",
      xAxis: datetimeColumns[0].name,
      yAxis: statusColumns[0].name,
      aggregation: "count",
      priority: 6,
      category: "errors",
    });
  }

  // Geographic analysis
  if (geoColumns.length > 0) {
    suggestions.push({
      type: "bar",
      title: "Requests by Country",
      description: "Geographic distribution of requests",
      xAxis: geoColumns[0].name,
      yAxis: "count",
      aggregation: "count",
      priority: 5,
      category: "geographic",
    });
  }

  // Cache analysis
  if (
    columns.some((c) => c.name === "cache_enabled") &&
    latencyColumns.length > 0
  ) {
    suggestions.push({
      type: "box-plot",
      title: "Cache Performance Impact",
      description: "Compare latency with/without cache",
      xAxis: "cache_enabled",
      yAxis: latencyColumns[0].name,
      priority: 6,
      category: "performance",
    });
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}

export function aggregateDataForChart(
  data: Array<Record<string, any>>,
  xColumn: string,
  yColumn: string,
  aggregation: "sum" | "avg" | "count" | "max" | "min" = "avg",
  groupBy?: "hour" | "day" | "week" | "month",
): Array<Record<string, any>> {
  if (!data.length) return [];

  // Handle time-based grouping for datetime columns
  if (groupBy && xColumn.includes("created_at")) {
    return aggregateByTime(data, xColumn, yColumn, aggregation, groupBy);
  }

  // Group by categorical values
  const groups: Record<string, any[]> = {};

  data.forEach((row) => {
    const key = String(row[xColumn]);
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });

  return Object.entries(groups).map(([key, group]) => {
    const result: Record<string, any> = { [xColumn]: key };

    if (aggregation === "count") {
      result[yColumn] = group.length;
    } else {
      const values = group
        .map((row) => Number(row[yColumn]))
        .filter((v) => !isNaN(v));
      if (values.length === 0) {
        result[yColumn] = 0;
      } else {
        switch (aggregation) {
          case "sum":
            result[yColumn] = values.reduce((a, b) => a + b, 0);
            break;
          case "avg":
            result[yColumn] = values.reduce((a, b) => a + b, 0) / values.length;
            break;
          case "max":
            result[yColumn] = Math.max(...values);
            break;
          case "min":
            result[yColumn] = Math.min(...values);
            break;
        }
      }
    }

    return result;
  });
}

function aggregateByTime(
  data: Array<Record<string, any>>,
  xColumn: string,
  yColumn: string,
  aggregation: "sum" | "avg" | "count" | "max" | "min",
  groupBy: "hour" | "day" | "week" | "month",
): Array<Record<string, any>> {
  const groups: Record<string, any[]> = {};

  data.forEach((row) => {
    const date = new Date(row[xColumn]);
    let key: string;

    switch (groupBy) {
      case "hour":
        key = date.toISOString().substring(0, 13) + ":00:00Z";
        break;
      case "day":
        key = date.toISOString().substring(0, 10);
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().substring(0, 10);
        break;
      case "month":
        key = date.toISOString().substring(0, 7);
        break;
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, group]) => {
      const result: Record<string, any> = { [xColumn]: key };

      if (aggregation === "count") {
        result[yColumn] = group.length;
      } else {
        const values = group
          .map((row) => Number(row[yColumn]))
          .filter((v) => !isNaN(v));
        if (values.length === 0) {
          result[yColumn] = 0;
        } else {
          switch (aggregation) {
            case "sum":
              result[yColumn] = values.reduce((a, b) => a + b, 0);
              break;
            case "avg":
              result[yColumn] =
                values.reduce((a, b) => a + b, 0) / values.length;
              break;
            case "max":
              result[yColumn] = Math.max(...values);
              break;
            case "min":
              result[yColumn] = Math.min(...values);
              break;
          }
        }
      }

      return result;
    });
}

export function formatChartValue(value: any, column: HqlColumn): string {
  if (value === null || value === undefined) return "N/A";

  if (column.type === "datetime") {
    return new Date(value).toLocaleDateString();
  }

  if (column.isCost) {
    return `$${Number(value).toFixed(4)}`;
  }

  if (column.isLatency) {
    return `${Number(value).toFixed(0)}ms`;
  }

  if (column.isToken) {
    return `${Number(value).toLocaleString()} tokens`;
  }

  if (column.type === "numeric") {
    return Number(value).toLocaleString();
  }

  return String(value);
}
