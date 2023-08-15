import { Env } from "../..";
import { Result } from "../../results";
import { Client } from "pg";

export class DatabaseExecutor {
  private client: Client;
  private ctx: ExecutionContext;

  constructor(env: Env, ctx: ExecutionContext) {
    this.client = new Client({
      connectionString: env.STORAGE_URL,
    });
    this.ctx = ctx;
  }

  public async dbExecute<T>(
    query: string,
    parameters: any[]
  ): Promise<Result<T[], string>> {
    try {
      await this.client.connect();

      const result = await this.client.query(query, parameters);

      // Ensure the client disconnects even if worker is killed
      this.ctx.waitUntil(this.client.end());

      return { data: result.rows, error: null };
    } catch (err) {
      console.error("Error executing query: ", query, parameters);
      console.error(err);
      await this.client.end();
      return { data: null, error: JSON.stringify(err) };
    }
  }
}
