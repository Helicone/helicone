import { Result } from "../util/results";
import { Client } from "pg";

export class PgWrapper {
  constructor(
    private databaseUrl: string,
    private ssl: string,
    private environment: string
  ) {}

  async dbExecute<T>(
    query: string,
    parameters: any[]
  ): Promise<Result<T[], string>> {
    const ssl =
      this.environment === "development"
        ? undefined
        : {
            rejectUnauthorized: true,
            ca: this.ssl.split("\\n").join("\n"),
          };

    const client = new Client({
      connectionString: this.databaseUrl,
      ssl,
    });
    try {
      // Let's print out the time it takes to execute the query
      await client.connect();

      const result = await client.query(query, parameters);

      await client.end();

      return { data: result.rows, error: null };
    } catch (err) {
      await client.end();
      return { data: null, error: JSON.stringify(err) };
    }
  }
}
