import { PostgrestBuilder } from "@supabase/postgrest-js";

interface WithTimingParams {
  queryName: string;
  percentLogging?: number;
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
    { queryName, percentLogging = 1 }: WithTimingParams
  ) {
    if (!SupabaseWrapper.ctx) {
      throw new Error("ExecutionContext is not set.");
    }

    const timestamp = Math.floor(new Date().getTime() / 1000);
    const start = performance.now();
    const result = await promise;
    const end = performance.now();

    const randomNumber = Math.random();

    // Log based on the percentage
    if (randomNumber < percentLogging) {
      SupabaseWrapper.ctx.waitUntil(
        new Promise(async () => {
          const distribution = {
            series: [
              {
                metric: "postgres.query.execution_time",
                points: [[timestamp, [end - start]]],
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
              "DD-API-KEY": SupabaseWrapper.dataDogConfig.apiKey,
            },
            body: JSON.stringify(distribution),
          };

          const response = await fetch(
            `${SupabaseWrapper.dataDogConfig.endpoint}/v1/distribution_points`,
            requestInit
          );

          return response;
        })
      );
    }

    return result;
  }
}

export function withTiming<T>(
  promise: PostgrestBuilder<T>,
  params: WithTimingParams
) {
  return SupabaseWrapper.getInstance().withTiming<T>(promise, params);
}
