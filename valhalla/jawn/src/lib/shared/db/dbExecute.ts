import { Client } from "pg";
import { Result } from "../result";
import { clickhouseDb } from "../../db/ClickhouseWrapper";
import { HELICONE_DB } from "./pgpClient";

export function paramsToValues(params: (number | string | boolean | Date)[]) {
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

// DEPRECATED
export async function dbQueryClickhouse<T>(
  query: string,
  parameters: (number | string | boolean | Date)[]
): Promise<Result<T[], string>> {
  return clickhouseDb.dbQuery<T>(query, parameters);
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
    statement_timeout: 10000,
  });

  try {
    const result = await HELICONE_DB.any(query, parameters);

    return { data: result, error: null };
  } catch (err) {
    console.error("Error executing query: ", query, parameters);
    console.error(err);
    await client.end();
    return { data: null, error: JSON.stringify(err) };
  }
}
