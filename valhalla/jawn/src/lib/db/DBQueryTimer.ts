import { PostgrestBuilder } from "@supabase/postgrest-js";

export const FREQUENT_PRECENT_LOGGING = 0.01;

interface WithTimingParams {
  queryName: string;
  percentLogging?: number;
}

interface DataDogConfig {
  enabled: boolean;
  apiKey: string;
  endpoint: string;
}

export class DBQueryTimer {
  private dataDogConfig: DataDogConfig;

  constructor(dataDogConfig: DataDogConfig) {
    this.dataDogConfig = dataDogConfig;
  }

  async withTiming<T>(
    promise: PostgrestBuilder<T>,
    { queryName, percentLogging = 1 }: WithTimingParams
  ) {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const start = performance.now();
    const result = await promise;
    const end = performance.now();

    const randomNumber = Math.random();

    // Log based on the percentage
    if (this.dataDogConfig.enabled && randomNumber < percentLogging) {
      this.logDistributionMetric(timestamp, end - start, queryName).then();
    }

    return result;
  }

  async logDistributionMetric(
    timestamp: number,
    executionTimeMs: number,
    queryName: string
  ): Promise<Response> {
    try {
      const distribution = {
        series: [
          {
            metric: "postgres.query.execution_time",
            points: [[timestamp, [executionTimeMs]]],
            host: "cloudflare_worker",
            // Query name should be `<operation>_<entity>_<action>`, e.g. `select_user_by_id`
            tags: ["query_name:" + queryName],
          },
        ],
      };

      const requestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "string",
          "DD-API-KEY": this.dataDogConfig.apiKey,
        },
        body: JSON.stringify(distribution),
      };

      const response = await fetch(
        `${this.dataDogConfig.endpoint}/v1/distribution_points`,
        requestInit
      );

      return response;
    } catch (e) {
      console.error("Error logging distribution metric", e);
      return new Response("Error logging distribution metric", {
        status: 500,
      });
    }
  }
}
