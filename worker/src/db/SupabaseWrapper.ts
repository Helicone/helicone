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

    const start = performance.now();
    const result = await promise;
    const end = performance.now();
    console.log(`Query ${queryName} took ${end - start} ms`);

    SupabaseWrapper.ctx.waitUntil(
      new Promise(async () => {
        const logEntry = {
          ddsource: "supabase",
          service: "worker",
          hostname: "your-hostname",
          ddtags: `queryname:${queryName}`,
          message: `Query ${queryName} took ${end - start} ms`,
        };

        const response = await fetch(SupabaseWrapper.dataDogConfig.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "DD-API-KEY": SupabaseWrapper.dataDogConfig.apiKey,
          },
          body: JSON.stringify(logEntry),
        });

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
