import { Client, QueryResult } from "pg";
import { getEnvironment } from "../environment/get";
import {
  GenericResult,
  PromiseGenericResult,
  err,
  ok,
} from "../modules/result";

export interface IValhallaDB {
  query(query: string): PromiseGenericResult<QueryResult<any>>;
  now(): PromiseGenericResult<QueryResult<any>>;
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

  async query(query: string): PromiseGenericResult<QueryResult<any>> {
    try {
      this.connect();
      return ok(await this.client.query(query));
    } catch (thrownErr) {
      return err(JSON.stringify(thrownErr));
    }
  }

  async now() {
    return this.query("SELECT NOW() as now");
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
