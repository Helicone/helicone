import { Client } from "pg";
import { Result } from "../result";
import { createClient as clickhouseCreateClient } from "@clickhouse/client";
// import dateFormat from "dateformat";
// const dateFormat = require("dateformat");

export function paramsToValues(params: (number | string | boolean | Date)[]) {
  return params
    .map((p) => {
      if (p instanceof Date) {
        //ex: 2023-05-27T08:21:26
        // return dateFormat(p, "yyyy-mm-dd HH:MM:ss", true);
        return p.toISOString().replace("T", " ").replace("Z", "");
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

export function printRunnableQuery(
  query: string,
  parameters: (number | string | boolean | Date)[]
) {
  const queryParams = paramsToValues(parameters);
  const setParams = Object.entries(queryParams)
    .map(([key, value]) => `SET param_${key} = '${value}';`)
    .join("\n");

  console.log(`\n\n${setParams}\n\n${query}\n\n`);
}

export async function dbQueryClickhouse<T>(
  query: string,
  parameters: (number | string | boolean | Date)[]
): Promise<Result<T[], string>> {
  try {
    const query_params = paramsToValues(parameters);

    const client = clickhouseCreateClient({
      host: process.env.CLICKHOUSE_HOST ?? "http://localhost:18123",
      username: process.env.CLICKHOUSE_USER ?? "default",
      password: process.env.CLICKHOUSE_PASSWORD ?? "",
    });

    const queryResult = await client.query({
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

export async function dbInsertClickhouse<
  T extends keyof ClickhouseDB["Tables"]
>(
  table: T,
  values: ClickhouseDB["Tables"][T][]
): Promise<Result<string, string>> {
  try {
    const client = clickhouseCreateClient({
      host: process.env.CLICKHOUSE_HOST ?? "http://localhost:18123",
      username: process.env.CLICKHOUSE_USER ?? "default",
      password: process.env.CLICKHOUSE_PASSWORD ?? "",
    });

    const queryResult = await client.insert({
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

/**
 * Executes a database query with the given parameters.
 * @param query - The SQL query to execute.
 * @param parameters - The parameters to be used in the query.
 * @returns A promise that resolves to a Result object containing the query result or an error message.
 */
export async function dbExecute<T>(
  query: string,
  parameters: any[]
): Promise<Result<T[], string>> {
  const ssl =
    process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development"
      ? {
          rejectUnauthorized: true,
          ca: process.env.SUPABASE_SSL_CERT_CONTENTS!.split("\\n").join("\n"),
        }
      : undefined;

  if (!process.env.SUPABASE_DATABASE_URL) {
    console.error("SUPABASE_DATABASE_URL not set");
    return { data: null, error: "DATABASE_URL not set" };
  }

  const client = new Client({
    connectionString: process.env.SUPABASE_DATABASE_URL,
    ssl,
  });

  try {
    // Let's print out the time it takes to execute the query
    await client.connect();

    const result = await client.query(query, parameters);

    await client.end();

    return { data: result.rows, error: null };
  } catch (err) {
    console.error("Error executing query: ", query, parameters);
    console.error(err);
    await client.end();
    return { data: null, error: JSON.stringify(err) };
  }
}

type Nullable<T> = T | null;

export interface RequestResponseLog {
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
  node_id: Nullable<string>;
  job_id: Nullable<string>;
  proxy_key_id: Nullable<string>;
  threat: Nullable<boolean>;
  time_to_first_token: Nullable<number>;
  target_url: Nullable<string>;
  request_ip: Nullable<string>;
  provider: Nullable<string>;
  country_code: Nullable<string>;
}

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

export interface ClickhouseDB {
  Tables: {
    properties_v3: PropertiesV3;
    request_response_log: RequestResponseLog;
    property_with_response_v1: PropertyWithResponseV1;
    cache_hits: CacheHits;
    rate_limit_log: RateLimitLog;
  };
}
