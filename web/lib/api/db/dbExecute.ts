import { Client } from "pg";
import { Result } from "../../../packages/common/result";
import { createClient as clickhouseCreateClient } from "@clickhouse/client";
import dateFormat from "dateformat";

export function paramsToValues(params: (number | string | boolean | Date)[]) {
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

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
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

/**
 * Builds a dynamic UPDATE query that only includes fields with defined values
 * @param options - Object containing query building options
 * @param options.from - The name of the table to update
 * @param options.set - Object containing fields to update with their values
 * @param options.where - Object containing field name and value for the WHERE clause
 * @returns An object with the SQL query string and parameters array
 */
export function buildDynamicUpdateQuery(options: {
  from: string;
  set: Record<string, any>;
  where: {
    field: string;
    equals: any;
  };
}): { query: string; params: any[] } {
  const { from, set, where } = options;
  const queryParts: string[] = [];
  const params: any[] = [];
  let paramCounter = 1;

  // Add only defined fields to the query
  for (const [key, value] of Object.entries(set)) {
    if (value !== undefined) {
      queryParts.push(`${key} = $${paramCounter++}`);
      params.push(value);
    }
  }

  // Add the WHERE clause parameter
  params.push(where.equals);

  // Build the final query
  const query = `UPDATE ${from} SET ${queryParts.join(", ")} WHERE ${
    where.field
  } = $${paramCounter}`;

  return { query, params };
}
