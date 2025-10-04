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

  async logDistributionMetric(
    timestamp: number,
    executionTimeMs: number,
    queryName: string,
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
        requestInit,
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
