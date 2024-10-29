import { createClient, ClickHouseClient } from "@clickhouse/client";
import { Result } from "../shared/result";

interface ClickhouseEnv {
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
}

export class ClickhouseClientWrapper {
  private clickHouseClient: ClickHouseClient;

  constructor(env: ClickhouseEnv) {
    this.clickHouseClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USER,
      password: env.CLICKHOUSE_PASSWORD,
    });
  }

  async dbInsertClickhouse<T extends keyof ClickhouseDB["Tables"]>(
    table: T,
    values: ClickhouseDB["Tables"][T][]
  ): Promise<Result<string, string>> {
    try {
      const queryResult = await this.clickHouseClient.insert({
        table: table,
        values: values,
        format: "JSONEachRow",
        // Recommended for cluster usage to avoid situations
        // where a query processing error occurred after the response code
        // and HTTP headers were sent to the client.
        // See https://clickhouse.com/docs/en/interfaces/http/#response-buffering
        clickhouse_settings: {
          async_insert: 1,
          wait_end_of_query: 1,
        },
      });
      return { data: queryResult.query_id, error: null };
    } catch (err) {
      console.error("dbInsertClickhouseError", err);
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }

  async dbQuery<T>(
    query: string,
    parameters: (number | string | boolean | Date)[]
  ): Promise<Result<T[], string>> {
    try {
      const query_params = paramsToValues(parameters);

      const queryResult = await this.clickHouseClient.query({
        query,
        query_params,
        format: "JSONEachRow",
        // Recommended for cluster usage to avoid situations
        // where a query processing error occurred after the response code
        // and HTTP headers were sent to the client.
        // See https://clickhouse.com/docs/en/interfaces/http/#response-buffering
        clickhouse_settings: {
          wait_end_of_query: 1,
        },
      });
      return { data: await queryResult.json<T[]>(), error: null };
    } catch (err) {
      console.error("Error executing Clickhouse query: ", query, parameters);
      console.error(err);
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }
}

function paramsToValues(params: (number | string | boolean | Date)[]) {
  return params
    .map((p) => {
      if (p instanceof Date) {
        return p
          .toISOString()
          .replace("T", " ")
          .replace("Z", "")
          .replace(/\.\d+$/, "");
      } else {
        return p;
      }
    })
    .reduce((acc, parameter, index) => {
      return {
        ...acc,
        [`val_${index}`]: parameter,
      };
    }, {});
}

export function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

type Nullable<T> = T | null;

interface PropertiesV3 {
  id: number;
  created_at: string;
  request_id: string;
  key: string;
  value: string;
  organization_id: string;
}

export interface PropertyWithResponseV1 {
  response_id: Nullable<string>;
  response_created_at: Nullable<string>;
  latency: Nullable<number>;
  status: number;
  completion_tokens: Nullable<number>;
  prompt_tokens: Nullable<number>;
  model: string;
  request_id: string;
  request_created_at: string;
  auth_hash: string;
  user_id: string;
  organization_id: string;
  time_to_first_token: Nullable<number>;
  property_key: string;
  property_value: string;
  threat: Nullable<boolean>;
  provider: Nullable<string>;
  country_code: Nullable<string>;
}

interface DeleteRequestResponseVersioned {
  organization_id: string;
  provider: Nullable<string>;
  model: string;
  request_created_at: string;
  request_id: string;
  sign: -1;
  version: number;
}

export interface CacheHits {
  request_id: string;
  organization_id: string;
  completion_tokens: Nullable<number>;
  prompt_tokens: Nullable<number>;
  latency: Nullable<number>;
  model: string;
  created_at: Nullable<string>;
  provider: Nullable<string>;
  country_code: Nullable<string>;
}

export interface RateLimitLog {
  organization_id: string;
  created_at: string;
}

export interface RateLimitLogV2 {
  request_id: string;
  organization_id: string;
  rate_limit_created_at: string;
}

export interface InsertRequestResponseVersioned {
  response_id: Nullable<string>;
  response_created_at: Nullable<string>;
  latency: Nullable<number>;
  status: number;
  completion_tokens: Nullable<number>;
  prompt_tokens: Nullable<number>;
  model: string;
  request_id: string;
  request_created_at: string;
  user_id: string;
  organization_id: string;
  proxy_key_id: Nullable<string>;
  threat: Nullable<boolean>;
  time_to_first_token: Nullable<number>;
  provider: Nullable<string>;
  country_code: Nullable<string>;
  target_url: Nullable<string>;
  sign: 1;
  version: number;
  properties: Record<string, string>;
  scores: Record<string, number>;
  request_body: string;
  response_body: string;
  assets: Array<string>;
}

export type RequestResponseVersioned =
  | InsertRequestResponseVersioned
  | DeleteRequestResponseVersioned;

export interface RequestResponseRMT {
  response_id: string;
  response_created_at: string;
  latency: number;
  status: number;
  completion_tokens: number;
  prompt_tokens: number;
  model: string;
  request_id: string;
  request_created_at: string;
  user_id: string;
  organization_id: string;
  proxy_key_id: string;
  threat: boolean;
  time_to_first_token: number;
  provider: string;
  country_code: string;
  target_url: string;
  properties: Record<string, string>;
  scores: Record<string, number>;
  request_body: string;
  response_body: string;
  assets: Array<string>;
  updated_at?: string;
  embedding?: number[];
}

export interface ClickhouseDB {
  Tables: {
    properties_v3: PropertiesV3;
    property_with_response_v1: PropertyWithResponseV1;
    request_response_versioned: RequestResponseVersioned;
    rate_limit_log: RateLimitLog;
    rate_limit_log_v2: RateLimitLogV2;
    cache_hits: CacheHits;
    request_response_rmt: RequestResponseRMT;
  };
}

const { CLICKHOUSE_USER, CLICKHOUSE_PASSWORD, CLICKHOUSE_HOST } = JSON.parse(
  process.env.CLICKHOUSE_CREDS ?? "{}"
) as {
  CLICKHOUSE_USER?: string;
  CLICKHOUSE_PASSWORD?: string;
  CLICKHOUSE_HOST?: string;
};

export const clickhouseDb = new ClickhouseClientWrapper({
  CLICKHOUSE_HOST:
    CLICKHOUSE_HOST ?? process.env.CLICKHOUSE_HOST ?? "http://localhost:18123",
  CLICKHOUSE_USER: CLICKHOUSE_USER ?? process.env.CLICKHOUSE_USER ?? "default",
  CLICKHOUSE_PASSWORD:
    CLICKHOUSE_PASSWORD ?? process.env.CLICKHOUSE_PASSWORD ?? "",
});
