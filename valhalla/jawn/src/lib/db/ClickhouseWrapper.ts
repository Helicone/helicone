import { createClient, ClickHouseClient } from "@clickhouse/client";
import { Result } from "../shared/result";

interface ClickhouseEnv {
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
}

class ClickhouseClientWrapper {
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
  created_at?: string;
  sign: 1;
  version: number;
  properties: Record<string, string>;
}
export type RequestResponseVersioned =
  | InsertRequestResponseVersioned
  | DeleteRequestResponseVersioned;

export interface ClickhouseDB {
  Tables: {
    properties_v3: PropertiesV3;
    property_with_response_v1: PropertyWithResponseV1;
    request_response_versioned: RequestResponseVersioned;
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
  CLICKHOUSE_HOST: CLICKHOUSE_HOST ?? "http://localhost:18123",
  CLICKHOUSE_USER: CLICKHOUSE_USER ?? "default",
  CLICKHOUSE_PASSWORD: CLICKHOUSE_PASSWORD ?? "",
});
