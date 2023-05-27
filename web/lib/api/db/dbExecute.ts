import { Client, Pool } from "pg";
import { Result } from "../../result";

import { createClient as clickhouseCreateClient } from "@clickhouse/client";
import dateFormat from "dateformat";

export async function dbQueryClickhouse<T>(
  query: string,
  parameters: (number | string | boolean | Date)[]
): Promise<Result<T[], string>> {
  try {
    const query_params = parameters
      .map((p) => {
        if (p instanceof Date) {
          //ex: 2023-05-27T08:21:26
          return dateFormat(p, "yyyy-mm-dd HH:MM:ss");
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
    return {
      data: null,
      error: JSON.stringify(err),
    };
  }
}

export async function dbExecute<T>(
  query: string,
  parameters: any[]
): Promise<Result<T[], string>> {
  // console.log("Executing query: ", query, parameters);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Need to add ssl
    // ssl: process.env.NODE_ENV === "production",
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
