import { Env } from "..";
import { Result } from "../util/results";
import { Client } from "pg";

export class PgWrapper {
  private client: Client;
  private ctx: ExecutionContext;

  constructor(env: Env, ctx: ExecutionContext) {
    this.client = new Client({
      host: env.HYPERDRIVE.host,
      user: env.HYPERDRIVE.user,
      password: env.HYPERDRIVE.password,
      port: Number(env.HYPERDRIVE.port),
      database: env.HYPERDRIVE.database,
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

      this.ctx.waitUntil(this.client.end());

      return { data: result.rows, error: null };
    } catch (err: any) {
      this.ctx.waitUntil(this.client.end());
      return { data: null, error: JSON.stringify(err) };
    }
  }
}
