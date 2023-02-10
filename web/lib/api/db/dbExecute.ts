import { Client, Pool } from "pg";
import { Result } from "../../result";

export async function dbExecute<T>(
  query: string
): Promise<Result<T[], string>> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Need to add ssl
    // ssl: process.env.NODE_ENV === "production",
  });
  try {
    await client.connect();
    const result = await client.query(query);
    await client.end();
    return { data: result.rows, error: null };
  } catch (err) {
    console.error(err);
    await client.end();
    return { data: null, error: JSON.stringify(err) };
  }
}
