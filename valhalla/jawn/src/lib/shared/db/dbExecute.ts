import { Client } from "pg";
import { Result } from "../../../packages/common/result";
import { clickhouseDb } from "../../db/ClickhouseWrapper";
import { HELICONE_DB } from "./pgpClient";
import { SecretManager } from "@helicone-package/secrets/SecretManager";

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

export function getPGClient() {
  const ssl =
    process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development"
      ? {
          rejectUnauthorized: true,
          ca: SecretManager.getSecret("SUPABASE_SSL_CERT_CONTENTS")!
            .split("\\n")
            .join("\n"),
        }
      : undefined;
  const client = new Client({
    connectionString: SecretManager.getSecret("SUPABASE_DATABASE_URL"),
    ssl,
    statement_timeout: 10000,
  });
  return client;
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
  const databaseUrl = SecretManager.getSecret(
    "SUPABASE_DATABASE_URL", // TODO remove supabase URL eventually
    "DATABASE_URL"
  );
  if (!databaseUrl) {
    console.error("SUPABASE_DATABASE_URL not set");
    return { data: null, error: "DATABASE_URL not set" };
  }

  try {
    const result = await HELICONE_DB.any(query, parameters);

    return { data: result, error: null };
  } catch (err) {
    console.error("Error executing query: ", query, parameters);
    console.error(err);
    return { data: null, error: JSON.stringify(err) };
  }
}
