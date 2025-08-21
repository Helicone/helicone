import {
  ClickHouseClient,
  createClient,
  ClickHouseSettings,
} from "@clickhouse/client";
import { Result } from "../../packages/common/result";
import { TestClickhouseClientWrapper } from "./test/RealClickhouseWrapper";

interface ClickhouseEnv {
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  CLICKHOUSE_HQL_USER: string;
  CLICKHOUSE_HQL_PASSWORD: string;
}

export class ClickhouseClientWrapper {
  private clickHouseClient: ClickHouseClient;
  private clickHouseHqlClient: ClickHouseClient;

  constructor(env: ClickhouseEnv) {
    this.clickHouseClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USER,
      password: env.CLICKHOUSE_PASSWORD,
    });

    this.clickHouseHqlClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_HQL_USER,
      password: env.CLICKHOUSE_HQL_PASSWORD,
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

  async queryWithContext<T>({
    query,
    organizationId,
    parameters,
  }: {
    query: string;
    organizationId: string;
    parameters: (number | string | boolean | Date)[];
  }): Promise<Result<T[], string>> {
    try {
      const query_params = paramsToValues(parameters);

      // Check for SQL_helicone_organization_id variations with regex
      // This catches different cases, underscore variations, and potential injection attempts
      const forbiddenPattern = /sql[_\s]*helicone[_\s]*organization[_\s]*id/i;
      if (forbiddenPattern.test(query)) {
        return {
          data: null,
          error:
            "Query contains 'SQL_helicone_organization_id' keyword, which is not allowed in HQL queries",
        };
      }

      const queryResult = await this.clickHouseHqlClient.query({
        query,
        query_params,
        format: "JSONEachRow",
        clickhouse_settings: {
          wait_end_of_query: 1,
          max_execution_time: 30,
          max_memory_usage: "1000000000",
          max_rows_to_read: `${100_000_000}`,
          max_result_rows: "10000",
          SQL_helicone_organization_id: organizationId,
          readonly: "1",
          allow_ddl: 0,
        } as ClickHouseSettings,
      });
      return { data: await queryResult.json<T[]>(), error: null };
    } catch (err) {
      console.error(
        "Error executing HQL query with context: ",
        query,
        organizationId,
        parameters
      );
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
  prompt_cache_write_tokens: Nullable<number>;
  prompt_cache_read_tokens: Nullable<number>;
  prompt_audio_tokens: Nullable<number>;
  completion_audio_tokens: Nullable<number>;
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
  gateway_router_id?: string;
  gateway_deployment_target?: string;
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
  prompt_cache_write_tokens: number;
  prompt_cache_read_tokens: number;
  prompt_audio_tokens: number;
  completion_audio_tokens: number;
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
  cache_reference_id?: string;
  cache_enabled: boolean;
  cost: number;
  gateway_router_id?: string;
  gateway_deployment_target?: string;
  prompt_id?: string;
  prompt_version?: string;
  request_referrer?: string;
}

export interface Prompt2025Input {
  request_id: string;
  version_id: string;
  inputs: Record<string, any>;
  environment?: string;
}

export interface CacheMetricSMT {
  organization_id: string;
  date: string;
  hour: number;
  request_id: string;
  model: string;
  provider: string;
  cache_hit_count: number;

  // Saving metrics
  saved_latency_ms: number;
  saved_completion_tokens: number;
  saved_prompt_tokens: number;
  saved_completion_audio_tokens: number;
  saved_prompt_audio_tokens: number;
  saved_prompt_cache_write_tokens: number;
  saved_prompt_cache_read_tokens: number;

  last_hit: string;
  first_hit: string;

  request_body: string;
  response_body: string;
}

export interface JawnHttpLogs {
  organization_id: string;
  method: string;
  url: string;
  status: number;
  duration: number;
  user_agent: string;
  timestamp: string;
  properties: Record<string, string>;
}

export interface Tags {
  organization_id: string;
  entity_type: string;
  entity_id: string;
  tag: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClickhouseDB {
  Tables: {
    properties_v3: PropertiesV3;
    property_with_response_v1: PropertyWithResponseV1;
    request_response_versioned: RequestResponseVersioned;
    cache_metrics: CacheMetricSMT;
    rate_limit_log: RateLimitLog;
    rate_limit_log_v2: RateLimitLogV2;
    cache_hits: CacheHits;
    request_response_rmt: RequestResponseRMT;
    tags: Tags;
    jawn_http_logs: JawnHttpLogs;
  };
}

const {
  CLICKHOUSE_USER,
  CLICKHOUSE_PASSWORD,
  CLICKHOUSE_HOST,
  CLICKHOUSE_HQL_USER,
  CLICKHOUSE_HQL_PASSWORD,
} = JSON.parse(process.env.CLICKHOUSE_CREDS ?? "{}") as {
  CLICKHOUSE_USER?: string;
  CLICKHOUSE_PASSWORD?: string;
  CLICKHOUSE_HOST?: string;
  CLICKHOUSE_HQL_USER?: string;
  CLICKHOUSE_HQL_PASSWORD?: string;
};

export const clickhouseDb = (() => {
  if (process.env.NODE_ENV === "test") {
    return new TestClickhouseClientWrapper({
      CLICKHOUSE_HOST: "http://localhost:18124",
      CLICKHOUSE_USER: "default",
      CLICKHOUSE_HQL_USER:
        CLICKHOUSE_HQL_USER ?? process.env.CLICKHOUSE_HQL_USER ?? "hql_user",
      CLICKHOUSE_HQL_PASSWORD:
        CLICKHOUSE_HQL_PASSWORD ?? process.env.CLICKHOUSE_HQL_PASSWORD ?? "",
      CLICKHOUSE_PASSWORD: "",
    });
  }
  return new ClickhouseClientWrapper({
    CLICKHOUSE_HOST:
      CLICKHOUSE_HOST ??
      process.env.CLICKHOUSE_HOST ??
      "http://localhost:18123",
    CLICKHOUSE_USER:
      CLICKHOUSE_USER ?? process.env.CLICKHOUSE_USER ?? "default",
    CLICKHOUSE_PASSWORD:
      CLICKHOUSE_PASSWORD ?? process.env.CLICKHOUSE_PASSWORD ?? "",
    CLICKHOUSE_HQL_USER:
      CLICKHOUSE_HQL_USER ?? process.env.CLICKHOUSE_HQL_USER ?? "hql_user",
    CLICKHOUSE_HQL_PASSWORD:
      CLICKHOUSE_HQL_PASSWORD ?? process.env.CLICKHOUSE_HQL_PASSWORD ?? "",
  });
})();
