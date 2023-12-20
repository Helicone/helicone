import { Result } from "../../results";
import { createClient } from "@clickhouse/client-web";
import { WebClickHouseClient } from "@clickhouse/client-web/dist/client";
import dateFormat from "dateformat";

export interface ClickhouseEnv {
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
}

function paramsToValues(params: (number | string | boolean | Date)[]) {
  return params
    .map((p) => {
      if (p instanceof Date) {
        //ex: 2023-05-27T08:21:26
        return dateFormat(p, "yyyy-mm-dd HH:MM:ss", true);
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

export class ClickhouseClientWrapper {
  private clickHouseClient: WebClickHouseClient;

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

  async dbUpdateClickhouse(query: string): Promise<Result<string, string>> {
    try {
      const commandResult = await this.clickHouseClient.command({
        query,
        // Recommended for cluster usage to avoid situations
        // where a query processing error occurred after the response code
        // and HTTP headers were sent to the client.
        // See https://clickhouse.com/docs/en/interfaces/http/#response-buffering
        clickhouse_settings: {
          wait_end_of_query: 1,
        },
      });

      return { data: commandResult.query_id, error: null };
    } catch (error: unknown) {
      console.error("dbUpdateClickhouseError", error);
      return {
        data: null,
        error: JSON.stringify(error),
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
      console.error("Error executing query: ", query, parameters);
      console.error(err);
      return {
        data: null,
        error: JSON.stringify(err),
      };
    }
  }
}

type Nullable<T> = T | null;

interface ResponseCopyV1 {
  response_id: Nullable<string>;
  response_created_at: Nullable<string>;
  latency: Nullable<number>;
  status: Nullable<number>;
  completion_tokens: Nullable<number>;
  prompt_tokens: Nullable<number>;
  model: Nullable<string>;
  request_id: string;
  request_created_at: string;
  auth_hash: string;
  user_id: Nullable<string>;
}

interface ResponseCopyV2 {
  response_id: Nullable<string>;
  response_created_at: Nullable<string>;
  latency: Nullable<number>;
  status: Nullable<number>;
  completion_tokens: Nullable<number>;
  prompt_tokens: Nullable<number>;
  model: Nullable<string>;
  request_id: string;
  request_created_at: string;
  auth_hash: string;
  user_id: Nullable<string>;
  organization_id: string;
}

export interface ResponseCopyV3 extends ResponseCopyV2 {
  node_id: Nullable<string>;
  job_id: Nullable<string>;
  proxy_key_id: Nullable<string>;
}

interface PropertiesCopyV1 {
  id: number;
  created_at: Nullable<string>;
  user_id: Nullable<string>;
  request_id: string;
  auth_hash: string;
  key: Nullable<string>;
  value: Nullable<string>;
}

interface PropertiesCopyV2 {
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
  property_key: string;
  property_value: string;
}

export interface CacheHits {
  request_id: string;
  organization_id: string;
  created_at: Nullable<string>;
}

export interface ClickhouseDB {
  Tables: {
    response_copy_v1: ResponseCopyV1;
    properties_copy_v1: PropertiesCopyV1;
    response_copy_v2: ResponseCopyV2;
    properties_copy_v2: PropertiesCopyV2;
    response_copy_v3: ResponseCopyV3;
    property_with_response_v1: PropertyWithResponseV1;
    cache_hits: CacheHits;
  };
}
