import { Result } from "../../results";
import {
  ClickHouseClient,
  CommandParams,
  CommandResult,
  toSearchParams,
  encodeJSON,
} from "@clickhouse/client-common";
import {
  ClickHouseSettings,
  DataFormat,
  InsertResult,
  createClient,
  InsertParams as ConnectionInsertParams,
} from "@clickhouse/client";
import { TLSParams } from "@clickhouse/client/dist/connection";

type InsertValues<T> = ReadonlyArray<T>;
export interface InsertParams<T = unknown> extends BaseParams {
  /** Name of a table to insert into. */
  table: string;
  /** A dataset to insert. */
  values: InsertValues<T>;
  /** Format of the dataset to insert. */
  format?: DataFormat;
}

export interface UpdateParams<T = unknown> extends BaseParams {
  /** Name of a table to insert into. */
  table: string;
  /** A dataset to update. */
  values: InsertValues<T>;
  /** Format of the dataset to insert. */
  condition: string;
}

export interface ClickhouseEnv {
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
}

interface BaseParams {
  /** ClickHouse settings that can be applied on query level. */
  clickhouse_settings?: ClickHouseSettings;
  /** Parameters for query binding. https://clickhouse.com/docs/en/interfaces/http/#cli-queries-with-parameters */
  query_params?: Record<string, unknown>;
  /** AbortSignal instance (using `node-abort-controller` package) to cancel a request in progress. */
  abort_signal?: AbortSignal;
  /** A specific `query_id` that will be sent with this request.
   * If it is not set, a random identifier will be generated automatically by the client. */
  query_id?: string;
}

function createUrl(host: string): URL {
  try {
    return new URL(host);
  } catch (err) {
    throw new Error('Configuration parameter "host" contains malformed url.');
  }
}

function normalizeConfig(config: any) {
  let tls: TLSParams | undefined = undefined;
  if (config.tls) {
    if ("cert" in config.tls && "key" in config.tls) {
      tls = {
        type: "Mutual",
        ...config.tls,
      };
    } else {
      tls = {
        type: "Basic",
        ...config.tls,
      };
    }
  }
  return {
    application_id: config.application,
    url: createUrl(config.host ?? "http://localhost:18123"),
    connect_timeout: config.connect_timeout ?? 10_000,
    request_timeout: config.request_timeout ?? 300_000,
    max_open_connections: config.max_open_connections ?? Infinity,
    tls,
    compression: {
      decompress_response: config.compression?.response ?? true,
      compress_request: config.compression?.request ?? false,
    },
    username: config.username ?? "default",
    password: config.password ?? "",
    application: config.application ?? "clickhouse-js",
    database: config.database ?? "default",
    clickhouse_settings: config.clickhouse_settings ?? {},
    log: {
      LoggerClass: config.log?.LoggerClass,
    },
    session_id: config.session_id,
  };
}

export function encodeValues<T>(
  values: InsertValues<T>,
  format: DataFormat
): string {
  // JSON* arrays
  if (Array.isArray(values)) {
    return (
      values
        // date must be 2023-04-27T18:40:36.311693
        .map((value) => {
          const ret = value instanceof Date ? value.toISOString() : value;
          return ret;
        })
        .map((value) => encodeJSON(value, format))
        .join("")
    );
  }
  // JSON & JSONObjectEachRow format input
  if (typeof values === "object") {
    return encodeJSON(values, format);
  }
  throw new Error(
    `Cannot encode values of type ${typeof values} with ${format} format`
  );
}

export function transformUrl({
  url,
  pathname,
  searchParams,
}: {
  url: URL;
  pathname?: string;
  searchParams?: URLSearchParams;
}): URL {
  const newUrl = new URL(url);

  if (pathname) {
    newUrl.pathname = pathname;
  }

  if (searchParams) {
    newUrl.search = searchParams?.toString();
  }

  return newUrl;
}

type NormalizedConfig = ReturnType<typeof normalizeConfig>;
class ClickhouseClient {
  private readonly config: NormalizedConfig;

  constructor(config: any = {}) {
    this.config = normalizeConfig(config);
  }

  private getBaseParams(params: BaseParams) {
    return {
      clickhouse_settings: {
        ...this.config.clickhouse_settings,
        ...params.clickhouse_settings,
      },
      query_params: params.query_params,
      abort_signal: params.abort_signal,
      session_id: this.config.session_id,
      query_id: params.query_id,
    };
  }

  // async command(params: CommandParams): Promise<CommandResult> {
  //   const query_id = params.query_id || crypto.randomUUID();
  //   const thisSearchParams = toSearchParams({
  //     database: this.config.database,
  //     query: params.query,
  //     clickhouse_settings: params.clickhouse_settings,
  //     query_params: params.query_params,
  //     session_id: this.config.session_id,
  //     query_id,
  //   });

  //   const xParams = {
  //     method: "POST",
  //     url: transformUrl({
  //       url: this.config.url,
  //       pathname: "/",
  //       searchParams: thisSearchParams,
  //     }),
  //     abort_signal: params.abort_signal,
  //   };

  //   const response = await fetch(xParams.url.toString(), {
  //     method: xParams.method,
  //     headers: {
  //       "Content-Type": "text/plain",
  //       Authorization: `Basic ${Buffer.from(
  //         `${this.config.username}:${this.config.password}`
  //       ).toString("base64")}`,
  //     },
  //     signal: xParams.abort_signal,
  //   });

  //   // Ensure the response stream is destroyed immediately
  //   response.body?.destroy();

  //   return { query_id };
  // }

  async connection_insert(
    params: ConnectionInsertParams
  ): Promise<InsertResult> {
    const query_id = params.query_id || crypto.randomUUID();
    const thisSearchParams = toSearchParams({
      database: this.config.database,
      clickhouse_settings: params.clickhouse_settings,
      query_params: params.query_params,
      query: params.query,
      session_id: params.session_id,
      query_id,
    });

    const xParams = {
      method: "POST",
      url: transformUrl({
        url: this.config.url,
        pathname: "/",
        searchParams: thisSearchParams,
      }),
      body: params.values,
      abort_signal: params.abort_signal,
    };
    // DEBUG LOGS
    // console.log("url", xParams.url.toString());
    // console.log("xParams Body", xParams.body);
    // console.log("xParams Type", typeof xParams.body);
    // console.log("method", xParams.method);

    // console.log("To run this in curl, try:");
    // console.log(
    //   `curl -X ${
    //     xParams.method
    //   } -H "Content-Type: text/plain" -H "Authorization: Basic ${Buffer.from(
    //     `${this.config.username}:${this.config.password}`
    //   ).toString("base64")}" -d '${xParams.body}' ${xParams.url.toString()}`
    // );
    await fetch(xParams.url.toString(), {
      method: xParams.method,
      headers: {
        "Content-Type": "text/plain",
        Authorization: `Basic ${Buffer.from(
          `${this.config.username}:${this.config.password}`
        ).toString("base64")}`,
      },
      body:
        typeof xParams.body === "string" ? xParams.body : xParams.body.read(),
      signal: xParams.abort_signal,
    });

    return { query_id };
  }

  async insert<T>(params: InsertParams<T>): Promise<InsertResult> {
    const format = params.format || "JSONCompactEachRow";

    const query = `INSERT INTO ${params.table.trim()} FORMAT ${format}`;

    return await this.connection_insert({
      query,
      values: encodeValues(params.values, format),
      ...this.getBaseParams(params),
    });
  }

  async update(params: UpdateParams): Promise<InsertResult> {
    const query = `ALTER TABLE ${params.table.trim()} UPDATE ${
      params.values
    } WHERE ${params.condition}`;

    return await this.command({
      query,
    });
  }
}

export class ClickhouseClientWrapper {
  private config: NormalizedConfig;
  private client: ClickhouseClient;
  private clickHouseClient: ClickHouseClient;

  constructor(env: ClickhouseEnv) {
    this.config = normalizeConfig({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USER,
      password: env.CLICKHOUSE_PASSWORD,
    });

    this.client = new ClickhouseClient(this.config);

    this.clickHouseClient = createClient({
      host: env.CLICKHOUSE_HOST,
      username: env.CLICKHOUSE_USER,
      password: env.CLICKHOUSE_PASSWORD,
    });
  }

  /*
  async insert<T>(params: InsertParams<T>): Promise<InsertResult> {
    const format = params.format || "JSONCompactEachRow";

    const query = `INSERT INTO ${params.table.trim()} FORMAT ${format}`;

    return await this.connection_insert({
      query,
      values: encodeValues(params.values, format),
      ...this.getBaseParams(params),
    });
  }

  private getBaseParams(params: BaseParams) {
    return {
      clickhouse_settings: {
        ...this.config.clickhouse_settings,
        ...params.clickhouse_settings,
      },
      query_params: params.query_params,
      abort_signal: params.abort_signal,
      session_id: this.config.session_id,
      query_id: params.query_id,
    };
  }
  */

  async dbInsertClickhouse<T extends keyof ClickhouseDB["Tables"]>(
    table: T,
    values: ClickhouseDB["Tables"][T][]
  ): Promise<Result<string, string>> {
    const format = "JSONEachRow" || "JSONCompactEachRow";
    try {
      const queryResult = await this.clickHouseClient.insert({
        table: table,
        values: encodeValues(values, format),
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

  async dbUpdateClickhouse<T extends keyof ["Tables"]>(
    table: T,
    values: ClickhouseDB["Tables"][T][]
  ) {
    this.clickHouseClient.command({});
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

type ResponseCopyV3 = ResponseCopyV2;

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

interface PropertyWithResponseV1 {
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

interface ProviderApiLogs {
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
  feedback_created_at: Nullable<string>;
  feedback_id: Nullable<number>;
  is_thumbs_up: Nullable<boolean>;
}

export interface ClickhouseDB {
  Tables: {
    response_copy_v1: ResponseCopyV1;
    properties_copy_v1: PropertiesCopyV1;
    response_copy_v2: ResponseCopyV2;
    properties_copy_v2: PropertiesCopyV2;
    response_copy_v3: ResponseCopyV3;
    property_with_response_v1: PropertyWithResponseV1;
    provider_api_logs: ProviderApiLogs;
  };
}
