import pgPromise from "pg-promise";
import { BatchPayload } from "../handlers/LoggingHandler";
import { PromiseGenericResult, err, ok } from "../modules/result";
import { deepCompare } from "../../utils/helpers";
import { Database } from "../db/database.types";

const pgp = pgPromise();
const db = pgp({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl:
    process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "development"
      ? {
          rejectUnauthorized: true,
          ca: process.env.SUPABASE_SSL_CERT_CONTENTS?.split("\\n").join("\n"),
        }
      : undefined,
});

const requestColumns = new pgp.helpers.ColumnSet(
  [
    "auth_hash",
    "body",
    "created_at",
    "formatted_prompt_id",
    "helicone_api_key_id",
    "helicone_org_id",
    "helicone_proxy_key_id",
    "helicone_user",
    { name: "id", cdn: true },
    "model",
    "model_override",
    "path",
    "prompt_id",
    "prompt_values",
    "properties",
    "provider",
    "request_ip",
    "target_url",
    "threat",
    "user_id",
  ],
  { table: "request" }
);
const onConflictRequest =
  " ON CONFLICT (id) DO UPDATE SET " +
  requestColumns.assignColumns({ from: "EXCLUDED", skip: "id" });

const responseColumns = new pgp.helpers.ColumnSet(
  [
    "body",
    "completion_tokens",
    "created_at",
    "delay_ms",
    "feedback",
    { name: "id", cdn: true },
    "model",
    "prompt_tokens",
    "request",
    "status",
    "time_to_first_token",
  ],
  { table: "response" }
);
const onConflictResponse =
  " ON CONFLICT (id) DO UPDATE SET " +
  responseColumns.assignColumns({ from: "EXCLUDED", skip: "id" });

const propertiesColumns = new pgp.helpers.ColumnSet(
  [
    "auth_hash",
    "created_at",
    { name: "id", cdn: true },
    ,
    "key",
    "request_id",
    "user_id",
    "value",
  ],
  { table: "properties" }
);
const onConflictProperties =
  " ON CONFLICT (id) DO UPDATE SET " +
  propertiesColumns.assignColumns({ from: "EXCLUDED", skip: "id" });

export class LogStore {
  constructor() {}

  async insertLogBatch(payload: BatchPayload): PromiseGenericResult<string> {
    try {
      await db.tx(async (t: pgPromise.ITask<{}>) => {
        // Insert into the 'request' table
        if (payload.requests && payload.requests.length > 0) {
          const insertRequest =
            pgp.helpers.insert(payload.requests, requestColumns) +
            onConflictRequest;
          await t.none(insertRequest);
        }

        // Insert into the 'response' table with conflict resolution
        if (payload.responses && payload.responses.length > 0) {
          const insertResponse =
            pgp.helpers.insert(payload.responses, responseColumns) +
            onConflictResponse;
          await t.none(insertResponse);
        }

        // Insert into the 'properties' table with conflict resolution
        if (payload.properties && payload.properties.length > 0) {
          const insertProperties =
            pgp.helpers.insert(payload.properties, propertiesColumns) +
            onConflictProperties;
          await t.none(insertProperties);
        }

        for (const request of payload.requests) {
          await this.processPrompt(
            t,
            request,
            request.organizationId,
            request.promptId
          );
        }
      });

      return ok("Successfully inserted log batch");
    } catch (error: any) {
      console.error("Failed to insert log batch", error);
      return err("Failed to insert log batch");
    }
  }

  async processPrompt(
    request: Database["public"]["Tables"]["request"]["Insert"],
    t: pgPromise.ITask<{}>
  ): PromiseGenericResult<string> {
    const heliconeTemplate = request.heliconeTemplate;

    // Select existing prompt or insert new one
    const existingPrompt = await t.oneOrNone(
      `SELECT * FROM prompt_v2 WHERE organization = $1 AND user_defined_id = $2 LIMIT 1`,
      [orgId, promptId]
    );
    if (!existingPrompt) {
      await t.none(
        `INSERT INTO prompt_v2 (user_defined_id, organization) VALUES ($1, $2)`,
        [promptId, orgId]
      );
    }
  }
}
