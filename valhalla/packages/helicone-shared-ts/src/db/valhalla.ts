import { Pool, QueryResult } from "pg";
import { getEnvironment } from "../environment/get";
import { PromiseGenericResult, Result, err, ok } from "../modules/result";
import {
  ValhallaFeedback,
  ValhallaRequest,
  ValhallaResponse,
} from "./valhalla.database.types";

export interface IValhallaDB {
  query(query: string, values: any[]): PromiseGenericResult<QueryResult<any>>;
  now(): PromiseGenericResult<QueryResult<any>>;
  insertRequest(
    request: ValhallaRequest
  ): PromiseGenericResult<QueryResult<any>>;
  insertResponse(
    response: ValhallaResponse
  ): PromiseGenericResult<QueryResult<any>>;
  updateResponse(
    response: ValhallaResponse
  ): PromiseGenericResult<QueryResult<any>>;
  upsertFeedback(
    feedback: ValhallaFeedback
  ): PromiseGenericResult<QueryResult<any>>;
  close(): Promise<void>;
}

async function timeoutPromise<T>(
  ms: number,
  promise: Promise<T>,
  errString?: string
): Promise<Result<T, string>> {
  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      resolve(err(errString ?? "rejected"));
    }, ms);
  });
  return (await Promise.race([promise.then((e) => ok(e)), timeout])) as Promise<
    Result<T, string>
  >;
}

class ValhallaDB implements IValhallaDB {
  pool: Pool;

  constructor(auroraCreds: string) {
    const auroraHost = process.env.AURORA_HOST;
    const auroraPort = process.env.AURORA_PORT;
    const auroraDb = process.env.AURORA_DATABASE;

    if (!auroraCreds) {
      throw new Error("No creds");
    }

    if (!auroraHost) {
      throw new Error("No host");
    }

    if (!auroraPort) {
      throw new Error("No port");
    }

    if (!auroraDb) {
      throw new Error("No database");
    }

    const {
      username,
      password,
    }: {
      username: string;
      password: string;
    } = JSON.parse(auroraCreds);

    this.pool = new Pool({
      host: auroraHost,
      port: parseInt(auroraPort),
      user: username,
      password: password,
      database: auroraDb,
      max: 1_000,
      idleTimeoutMillis: 1000, // close idle clients after 1 second
      connectionTimeoutMillis: 1000, // return an error after 1 second if connection could not be established
      maxUses: 7_200,
      ssl:
        getEnvironment() === "development"
          ? undefined
          : {
              rejectUnauthorized: true, // This should be set to true for better security
            },
    });
  }

  async close() {
    await this.pool.end();
  }
  private async _query(
    query: string,
    values: any[] = []
  ): PromiseGenericResult<QueryResult<any>> {
    try {
      const queryId = Math.random().toString(36).substring(7);

      console.log(
        `Attempting to connect to the database at ${new Date().toISOString()}, queryId: ${queryId}`
      );
      const { data: client, error: clientError } = await timeoutPromise(
        1000,
        this.pool.connect(),
        "Connection timed out"
      );
      if (clientError || !client) {
        console.error("Error connecting to the database, timeout", clientError);
        return err(clientError);
      }
      console.log(
        `Connected to the database at ${new Date().toISOString()}, queryId: ${queryId}`
      );

      const { data: result, error: resultError } = await timeoutPromise(
        2000,
        client.query(query, values).then(async (res) => {
          // sleep for 1 second to simulate a slow query
          // await new Promise((resolve) => setTimeout(resolve, 10_000));
          return res;
        }),
        "Query timed out"
      );

      if (resultError || !result) {
        console.error("Error in query", query, resultError);
        return err(resultError);
      }

      console.log(
        `Query complete at ${new Date().toISOString()}, queryId: ${queryId}`
      );
      client.release();
      return ok(result);
    } catch (thrownErr) {
      console.error("Error in query", query, thrownErr);
      return err(`There was an exception: ${JSON.stringify(thrownErr)}`);
    }
  }
  async query(
    query: string,
    values: any[] = []
  ): PromiseGenericResult<QueryResult<any>> {
    const { data: queryResult, error: queryResultError } = await timeoutPromise(
      3000,
      this._query(query, values).then(async (res) => {
        // sleep for 1 second to simulate a slow query
        // await new Promise((resolve) => setTimeout(resolve, 10_000));
        return res;
      }),
      "this.query timed out"
    );
    if (queryResultError || !queryResult) {
      console.error("Error in query", query, queryResultError);
      return err(queryResultError);
    }
    return queryResult;
  }

  async now() {
    return this.query("SELECT NOW() as now");
  }

  async upsertFeedback(
    feedback: ValhallaFeedback
  ): PromiseGenericResult<QueryResult<any>> {
    const query = `
      INSERT INTO feedback (
        response_id,
        rating,
        created_at
      )
      VALUES (
        $1, $2, $3
      )
      ON CONFLICT (response_id) DO UPDATE SET
        rating = EXCLUDED.rating,
        created_at = EXCLUDED.created_at;
    `;
    return this.query(query, [
      feedback.responseID,
      feedback.rating,
      feedback.createdAt.toISOString(),
    ]);
  }

  async updateResponse(
    response: ValhallaResponse
  ): PromiseGenericResult<QueryResult<any>> {
    const query = `
      UPDATE response
      SET
        body = $1,
        delay_ms = $2,
        http_status = $3,
        completion_tokens = $4,
        model = $5,
        prompt_tokens = $6,
        response_received_at = $7
      WHERE id = $8
    `;
    return this.query(query, [
      JSON.stringify(response.body),
      response.delayMs,
      response.http_status,
      response.completionTokens,
      response.model,
      response.promptTokens,
      response.responseReceivedAt?.toISOString(),
      response.id,
    ]);
  }

  async insertRequest(
    request: ValhallaRequest
  ): PromiseGenericResult<QueryResult<any>> {
    const query = `
      INSERT INTO request (
        id,
        created_at,
        url_href,
        user_id,
        properties,
        helicone_org_id,
        provider,
        body,
        request_received_at,
        model
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      );
    `;
    console.log("Inserting request", request.id);
    return this.query(query, [
      request.id,
      request.createdAt.toISOString(),
      request.urlHref,
      request.userId,
      JSON.stringify(request.properties),
      request.heliconeOrgID,
      request.provider,
      JSON.stringify(request.body),
      request.requestReceivedAt.toISOString(),
      request.model,
    ]);
  }

  async insertResponse(
    response: ValhallaResponse
  ): PromiseGenericResult<QueryResult<any>> {
    const query = `
    INSERT INTO response (
      id,
      created_at,
      body,
      request,
      delay_ms,
      http_status,
      completion_tokens,
      model,
      prompt_tokens,
      response_received_at,
      helicone_org_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `;
    return this.query(query, [
      response.id,
      response.createdAt.toISOString(),
      JSON.stringify(response.body),
      response.request,
      response.delayMs,
      response.http_status,
      response.completionTokens,
      response.model,
      response.promptTokens,
      response.responseReceivedAt?.toISOString(),
      response.heliconeOrgID,
    ]);
  }
}

class StaticValhallaPool {
  private static client: ValhallaDB | null = null;

  static async getClient(): Promise<IValhallaDB> {
    if (this.client === null) {
      const auroraCreds = process.env.AURORA_CREDS;
      if (!auroraCreds) {
        // TODO get from secrets manager?
        throw new Error("No creds found in secret");
      } else {
        this.client = new ValhallaDB(auroraCreds);
      }
    }
    return this.client;
  }
}

export async function createValhallaClient(): Promise<IValhallaDB> {
  return StaticValhallaPool.getClient();
}
