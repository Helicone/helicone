import { Client, QueryResult } from "pg";
import { getEnvironment } from "../environment/get";
import {
  GenericResult,
  PromiseGenericResult,
  err,
  ok,
} from "../modules/result";
import { ValhallaRequest, ValhallaResponse } from "./valhalla.database.types";

export interface IValhallaDB {
  query(query: string): PromiseGenericResult<QueryResult<any>>;
  now(): PromiseGenericResult<QueryResult<any>>;
  insertRequest(
    request: ValhallaRequest
  ): PromiseGenericResult<QueryResult<any>>;
  insertResponse(
    response: ValhallaResponse
  ): PromiseGenericResult<QueryResult<any>>;
}

class ValhallaDB implements IValhallaDB {
  client: Client;
  connected: boolean = false;

  constructor() {
    const auroraCreds = process.env.AURORA_CREDS || "";
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

    this.client = new Client({
      host: auroraHost,
      port: parseInt(auroraPort),
      user: username,
      password: password,
      database: auroraDb,
      ssl:
        getEnvironment() === "development"
          ? undefined
          : {
              rejectUnauthorized: true, // This should be set to true for better security
            },
    });
  }

  private async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }

  async query(
    query: string,
    values: any[] = []
  ): PromiseGenericResult<QueryResult<any>> {
    try {
      this.connect();
      return ok(await this.client.query(query, values));
    } catch (thrownErr) {
      console.error("Error in query", query, thrownErr);
      return err(JSON.stringify(thrownErr));
    }
  }

  async now() {
    return this.query("SELECT NOW() as now");
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
        body
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      );
    `;
    return this.query(query, [
      request.id,
      request.createdAt.toISOString(),
      request.urlHref,
      request.userId,
      JSON.stringify(request.properties),
      request.heliconeOrgID,
      request.provider,
      JSON.stringify(request.body),
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
      prompt_tokens
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
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
    ]);
  }
}

class StaticValhallaPool {
  private static client: ValhallaDB | null = null;

  static getClient(): IValhallaDB {
    if (this.client === null) {
      this.client = new ValhallaDB();
    }
    return this.client;
  }
}

export function createValhallaClient(): IValhallaDB {
  return StaticValhallaPool.getClient();
}
