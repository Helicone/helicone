import { PostgrestBuilder } from "@supabase/postgrest-js";

interface WithTimingParams {
  queryName: string;
}

interface DataDogConfig {
  apiKey: string;
  endpoint: string;
}

export class SupabaseWrapper {
  private static instance: SupabaseWrapper;
  private static ctx: ExecutionContext | null = null;
  private static dataDogConfig: DataDogConfig;

  private constructor() {}

  static initialize(ctx: ExecutionContext, dataDogConfig: DataDogConfig) {
    this.ctx = ctx;
    this.dataDogConfig = dataDogConfig;
  }

  static getInstance(): SupabaseWrapper {
    if (!this.instance) {
      if (!this.ctx) {
        throw new Error(
          "ExecutionContext is not set. Call initialize with ExecutionContext before getInstance."
        );
      }
      this.instance = new SupabaseWrapper();
    }
    return this.instance;
  }

  async withTiming<T>(
    promise: PostgrestBuilder<T>,
    { queryName }: WithTimingParams
  ) {
    if (!SupabaseWrapper.ctx) {
      throw new Error("ExecutionContext is not set.");
    }

    const timestamp = Math.floor(new Date().getTime() / 1000);
    const start = performance.now();
    const result = await promise;
    const end = performance.now();
    console.log(`Query ${queryName} took ${end - start} ms`);

    SupabaseWrapper.ctx.waitUntil(
      new Promise(async () => {
        const logEntry = {
          series: [
            {
              metric: "postgres.query.execution_time",
              type: 3, // guage
              points: [
                {
                  timestamp: timestamp,
                  value: end - start,
                },
              ],
              resources: [
                {
                  name: "cloudflare_worker",
                  type: "worker",
                },
              ],
              tags: ["query_name:" + queryName],
            },
          ],
        };

        // {
        //   "series": [
        //     {
        //       "metric": "example.metric.name",
        //       "type": 3,
        //       "points": [
        //         {
        //           "timestamp": 1636629071,
        //           "value": 0.7
        //         }
        //       ],
        //       "tags": ["environment:production", "version:1"],
        //       "resources": [
        //         {
        //           "name": "examplehost",
        //           "type": "host"
        //         }
        //       ],
        //       "metadata": {
        //         "unit": "milliseconds",
        //         "type": "gauge"
        //       },
        //       "origin": {
        //         "source_type_name": "my_source_type"
        //       },
        //       "metric_type": 3,
        //       "product": 123,
        //       "service": 456
        //     }
        //   ]
        // }

        const response = await fetch(
          `${SupabaseWrapper.dataDogConfig.endpoint}/v2/series`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "DD-API-KEY": SupabaseWrapper.dataDogConfig.apiKey,
            },
            body: JSON.stringify(logEntry),
          }
        );

        console.log(`DataDog response: ${response.status}`);
        console.log(`DataDog response: ${await response.text()}`);

        return response;
      })
    );

    return result;
  }
}

export function withTiming<T>(
  promise: PostgrestBuilder<T>,
  params: WithTimingParams
) {
  return SupabaseWrapper.getInstance().withTiming<T>(promise, params);
}
