import { Env } from "../..";
import { Result } from "../../results";
import { Client } from "pg";

export class DatabaseExecutor {
  private client: Client;

  constructor(env: Env) {
    this.client = new Client({
      connectionString: env.STORAGE_URL,
    });
  }

  public async dbExecute<T>(
    query: string,
    parameters: any[]
  ): Promise<Result<T[], string>> {
    try {
      await this.client.connect();

      const result = await this.client.query(query, parameters);

      await this.client.end();

      return { data: result.rows, error: null };
    } catch (err) {
      console.error("Error executing query: ", query, parameters);
      console.error(err);
      await this.client.end();
      return { data: null, error: JSON.stringify(err) };
    }
  }
}
