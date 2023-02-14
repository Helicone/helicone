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
    // Let's print out the time it takes to execute the query
    const start = Date.now();
    await client.connect();
    console.log(`Connected to database in ${Date.now() - start}ms`);
    const result = await client.query(query);
    console.log(`Query executed in ${Date.now() - start}ms`);
    await client.end();
    console.log(
      `Disconnected from database in ${Date.now() - start}ms \n ${query} , \n ${
        result.rows
      }`
    );
    return { data: result.rows, error: null };
  } catch (err) {
    console.error(err);
    await client.end();
    return { data: null, error: JSON.stringify(err) };
  }
}
