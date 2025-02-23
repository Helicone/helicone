import { BatchPayload } from "../handlers/LoggingHandler";
import { deepCompare } from "../../utils/helpers";
import pgPromise from "pg-promise";
import { PromptRecord } from "../handlers/HandlerContext";
import { PromiseGenericResult, ok, err } from "../shared/result";
import { Database } from "../db/database.types";

import { shouldBumpVersion } from "@helicone/prompts";
import { sanitizeObject } from "../../utils/sanitize";
import { mapScores } from "../../managers/score/ScoreManager";

import { HELICONE_PGP as pgp, HELICONE_DB as db } from "../shared/db/pgpClient";

process.on("exit", () => {
  pgp.end();
});

const requestColumns = new pgp.helpers.ColumnSet(
  [
    "id",
    "auth_hash",
    "body",
    "path",
    "provider",
    "created_at",
    { name: "formatted_prompt_id", def: null }, // Default to null if not provided
    { name: "helicone_api_key_id", def: null },
    { name: "helicone_org_id", def: null },
    { name: "helicone_proxy_key_id", def: null },
    { name: "helicone_user", def: null },
    { name: "model", def: null },
    { name: "model_override", def: null },
    { name: "prompt_id", def: null },
    { name: "prompt_values", def: null },
    { name: "properties", def: null },
    { name: "request_ip", def: null },
    { name: "target_url", def: null },
    { name: "threat", def: null },
    { name: "user_id", def: null },
    { name: "country_code", def: null },
    { name: "version", def: 1 },
  ],
  { table: "request" }
);
const onConflictRequest =
  " ON CONFLICT (id, helicone_org_id) DO UPDATE SET " +
  requestColumns.assignColumns({ from: "EXCLUDED", skip: "id" });

const responseColumns = new pgp.helpers.ColumnSet(
  [
    "id",
    "body",
    "request",
    "created_at",
    { name: "helicone_org_id", def: null },
    { name: "model", def: null },
    { name: "completion_tokens", def: null },
    { name: "delay_ms", def: null },
    { name: "feedback", def: null },
    { name: "prompt_tokens", def: null },
    { name: "status", def: null },
    { name: "time_to_first_token", def: null },
    { name: "prompt_cache_write_tokens", def: null },
    { name: "prompt_cache_read_tokens", def: null },
  ],
  { table: "response" }
);

const onConflictResponse =
  " ON CONFLICT (request, helicone_org_id) DO UPDATE SET " +
  responseColumns.assignColumns({ from: "EXCLUDED", skip: "id" });

const assetColumns = new pgp.helpers.ColumnSet(
  ["id", "request_id", "organization_id", "created_at"],
  { table: "asset" }
);

const onConflictAsset = " ON CONFLICT (id, request_id) DO NOTHING";

const requestResponseSearchColumns = new pgp.helpers.ColumnSet(
  [
    "request_id",
    { name: "request_body_vector", mod: ":raw" },
    { name: "response_body_vector", mod: ":raw" },
    "organization_id",
  ],
  { table: "request_response_search" }
);

const onConflictRequestResponseSearch = `ON CONFLICT (request_id, organization_id) DO UPDATE SET
request_body_vector = EXCLUDED.request_body_vector,
response_body_vector = EXCLUDED.response_body_vector`;

export class LogStore {
  constructor() {}

  async insertLogBatch(payload: BatchPayload): PromiseGenericResult<string> {
    try {
      await db.tx(async (t: pgPromise.ITask<{}>) => {
        // Insert into the 'request' table
        if (payload.requests && payload.requests.length > 0) {
          const filteredRequests = this.filterDuplicateRequests(
            payload.requests
          );

          try {
            if (filteredRequests && filteredRequests.length > 0) {
              const insertRequest =
                pgp.helpers.insert(filteredRequests, requestColumns) +
                onConflictRequest;
              await t.none(insertRequest);
            }
          } catch (error) {
            console.error("Error inserting request", error);
            throw error;
          }
        }

        // Insert into the 'response' table with conflict resolution
        if (payload.responses && payload.responses.length > 0) {
          const filteredResponses = this.filterDuplicateResponses(
            payload.responses
          );

          try {
            if (filteredResponses && filteredResponses.length > 0) {
              const insertResponse =
                pgp.helpers.insert(filteredResponses, responseColumns) +
                onConflictResponse;
              await t.none(insertResponse);
            }
          } catch (error) {
            console.error("Error inserting response", error);
            throw error;
          }
        }

        if (payload.assets && payload.assets.length > 0) {
          const insertResponse =
            pgp.helpers.insert(payload.assets, assetColumns) + onConflictAsset;
          await t.none(insertResponse);
        }

        if (payload.prompts && payload.prompts.length > 0) {
          payload.prompts.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
              if (a.createdAt < b.createdAt) {
                return -1;
              }
              if (a.createdAt > b.createdAt) {
                return 1;
              }
            }
            return 0;
          });

          for (const promptRecord of payload.prompts) {
            await this.processPrompt(promptRecord, t);
          }
        }

        if (payload.scores && payload.scores.length > 0) {
          for (const score of payload.scores) {
            await this.processScore({
              score: score.scores,
              requestId: score.requestId,
              organizationId: score.organizationId,
              evaluatorIds: score.evaluatorIds,
              t,
            });
          }
        }

        try {
          const searchRecords = this.filterDuplicateSearchRecords(
            payload.searchRecords
          ).map((record) => ({
            request_id: record.request_id,
            request_body_vector: `to_tsvector('helicone_search_config', ${pgp.as.text(
              record.request_body_vector
            )})`,
            response_body_vector: `to_tsvector('helicone_search_config', ${pgp.as.text(
              record.response_body_vector
            )})`,
            organization_id: record.organization_id,
          }));

          if (searchRecords && searchRecords.length > 0) {
            const insertSearchQuery =
              pgp.helpers.insert(searchRecords, requestResponseSearchColumns) +
              onConflictRequestResponseSearch;

            await t.none(insertSearchQuery);
          }
        } catch (error: any) {
          console.error("Error inserting search records", error);
          throw error;
        }
      });

      return ok("Successfully inserted log batch");
    } catch (error: any) {
      return err("Failed to insert log batch: " + error);
    }
  }

  async processPrompt(
    newPromptRecord: PromptRecord,
    t: pgPromise.ITask<{}>
  ): PromiseGenericResult<string> {
    const INVALID_TEMPLATE_ERROR = "Invalid template";
    const { promptId, orgId, requestId, heliconeTemplate, model } =
      newPromptRecord;

    if (!heliconeTemplate) {
      return ok("No Helicone template to process");
    }

    if (typeof heliconeTemplate.template === "string") {
      heliconeTemplate.template = {
        error: INVALID_TEMPLATE_ERROR,
        template: heliconeTemplate.template,
      };
    }

    // Ensure the prompt exists or create it, and lock the row
    let existingPrompt = await t.oneOrNone<{
      id: string;
      metadata: any;
    }>(
      `SELECT id, metadata FROM prompt_v2 WHERE organization = $1 AND user_defined_id = $2`,
      [orgId, promptId]
    );
    if (!existingPrompt) {
      try {
        existingPrompt = await t.one<{
          id: string;
          metadata: any;
        }>(
          `INSERT INTO prompt_v2 (user_defined_id, organization, created_at, metadata) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, metadata`,
          [promptId, orgId, newPromptRecord.createdAt, { createdFromUi: false }]
        );
      } catch (error) {
        console.error("Error inserting prompt", error);
        throw error;
      }
    }

    // Check the latest version and decide whether to update
    const existingPromptVersion = await t.oneOrNone<{
      id: string;
      major_version: number;
      minor_version: number;
      helicone_template: any;
      created_at: Date;
      metadata: any;
    }>(
      `SELECT id, major_version, minor_version, helicone_template, created_at, metadata
       FROM prompts_versions
       WHERE organization = $1 AND prompt_v2 = $2 
       ORDER BY major_version DESC, minor_version DESC LIMIT 1`,
      [orgId, existingPrompt.id]
    );

    let versionId = existingPromptVersion?.id ?? "";

    const isCreatedFromUi = existingPrompt.metadata?.createdFromUi as
      | boolean
      | undefined;

    const shouldBump = shouldBumpVersion({
      old: existingPromptVersion?.helicone_template ?? {},
      new: heliconeTemplate.template,
    });

    // Check if an update is necessary based on template comparison
    if (
      !isCreatedFromUi &&
      (!existingPromptVersion ||
        (shouldBump.shouldBump &&
          existingPromptVersion.created_at <= newPromptRecord.createdAt))
    ) {
      // Insert new record with incremented version
      const newMajorVersion = existingPromptVersion
        ? existingPromptVersion.major_version + 1
        : 0;

      try {
        const insertQuery = `
        INSERT INTO prompts_versions (prompt_v2, organization, major_version, minor_version, helicone_template, model, created_at, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`;

        const insertResult = await t.one(insertQuery, [
          existingPrompt.id,
          orgId,
          newMajorVersion,
          0,
          heliconeTemplate.template,
          model,
          newPromptRecord.createdAt,
          { isProduction: true },
        ]);

        versionId = insertResult.id;

        // Update previous production version to not be production
        if (existingPromptVersion) {
          await t.none(
            `UPDATE prompts_versions 
             SET metadata = metadata - 'isProduction'
             WHERE id = $1`,
            [existingPromptVersion.id]
          );
        }
      } catch (error) {
        console.error("Error updating and inserting prompt version", error);
        throw error;
      }
    } else if (
      shouldBump.shouldUpdateNotBump &&
      !(
        "error" in heliconeTemplate.template &&
        heliconeTemplate.template.error === INVALID_TEMPLATE_ERROR
      )
    ) {
      try {
        const updateQuery = `
        UPDATE prompts_versions
        SET helicone_template = $1
        WHERE id = $2
        RETURNING id`;

        const updateResult = await t.one(updateQuery, [
          sanitizeObject(heliconeTemplate.template),
          versionId,
        ]);

        versionId = updateResult.id;
      } catch (error) {
        console.error("Error updating prompt version", error);
        throw error;
      }
    }

    if (versionId && Object.keys(heliconeTemplate.inputs).length > 0) {
      try {
        await t.none(
          `INSERT INTO prompt_input_keys (key, prompt_version, created_at)
       SELECT unnest($1::text[]), $2, $3
       ON CONFLICT (key, prompt_version) DO NOTHING`,
          [
            `{${Object.keys(heliconeTemplate.inputs).join(",")}}`,
            versionId,
            newPromptRecord.createdAt.toISOString(),
          ]
        );
      } catch (error) {
        console.error("Error inserting prompt input keys", error);
        throw error;
      }

      try {
        // Record the inputs and source request
        await t.none(
          `INSERT INTO prompt_input_record (inputs, auto_prompt_inputs, source_request, prompt_version, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
          [
            JSON.stringify(heliconeTemplate.inputs),
            JSON.stringify(heliconeTemplate?.autoInputs ?? []),
            requestId,
            versionId,
            newPromptRecord.createdAt.toISOString(),
          ]
        );
      } catch (error) {
        console.error("Error inserting prompt input record", error);
        throw error;
      }
    }

    return ok("Prompt processed successfully");
  }

  async processScore({
    score,
    requestId,
    t,
    organizationId,
    evaluatorIds,
  }: {
    score: Record<string, number | boolean | undefined>;
    requestId: string;
    t: pgPromise.ITask<{}>;
    organizationId: string;
    evaluatorIds: Record<string, string>;
  }) {
    const mappedScores = mapScores(score);

    // Convert arrays for the upsert
    const scoreKeys = mappedScores.map((s) => s.score_attribute_key);
    const scoreTypes = mappedScores.map((s) => s.score_attribute_type);
    const scoreValues = mappedScores.map((s) => s.score_attribute_value);
    const organizationIds = Array(scoreKeys.length).fill(organizationId);
    const scoreEvaluatorIds = mappedScores.map((s) => {
      return evaluatorIds[s.score_attribute_key] || null;
    });
    // First upsert the score attributes and get their IDs
    const upsertedAttributes = await t.many(
      `
      WITH upserted_attributes AS (
        INSERT INTO score_attribute (score_key, value_type, organization, evaluator_id)
        SELECT unnest($1::text[]), unnest($2::text[]), unnest($3::uuid[]), unnest($4::uuid[])
        ON CONFLICT (score_key, organization) DO UPDATE SET
          score_key = EXCLUDED.score_key,
          value_type = EXCLUDED.value_type,
          evaluator_id = EXCLUDED.evaluator_id
        RETURNING id, score_key
      )
      SELECT id, score_key
      FROM upserted_attributes
    `,
      [scoreKeys, scoreTypes, organizationIds, scoreEvaluatorIds]
    );

    // Then insert the score values
    const attributeIds = upsertedAttributes.map((attr) => attr.id);
    await t.none(
      `
      INSERT INTO score_value (score_attribute, request_id, int_value)
      SELECT unnest($1::uuid[]), $2, unnest($3::bigint[])
      ON CONFLICT (score_attribute, request_id) DO NOTHING
    `,
      [attributeIds, requestId, scoreValues]
    );

    return ok("Scores processed successfully");
  }

  filterDuplicateRequests(
    entries: Database["public"]["Tables"]["request"]["Insert"][]
  ) {
    const entryMap = new Map<
      string,
      Database["public"]["Tables"]["request"]["Insert"]
    >();

    entries.forEach((entry) => {
      if (!entry.id) {
        return;
      }

      const existingEntry = entryMap.get(entry.id);

      // No existing entry, add it
      if (!existingEntry || !existingEntry.created_at) {
        entryMap.set(entry.id, entry);
        return;
      }

      if (
        entry.created_at &&
        new Date(entry.created_at) < new Date(existingEntry.created_at)
      ) {
        entryMap.set(entry.id, entry);
      }
    });

    return Array.from(entryMap.values());
  }

  filterDuplicateResponses(
    entries: Database["public"]["Tables"]["response"]["Insert"][]
  ) {
    const entryMap = new Map<
      string,
      Database["public"]["Tables"]["response"]["Insert"]
    >();

    entries.forEach((entry) => {
      if (!entry.request) {
        return;
      }

      const existingEntry = entryMap.get(entry.request);

      // No existing entry, add it
      if (!existingEntry || !existingEntry.created_at) {
        entryMap.set(entry.request, entry);
        return;
      }

      if (
        entry.created_at &&
        new Date(entry.created_at) < new Date(existingEntry.created_at)
      ) {
        entryMap.set(entry.request, entry);
      }
    });

    return Array.from(entryMap.values());
  }

  filterDuplicateSearchRecords(
    entries: Database["public"]["Tables"]["request_response_search"]["Insert"][]
  ) {
    const entryMap = new Map<
      string,
      Database["public"]["Tables"]["request_response_search"]["Insert"]
    >();

    entries.forEach((entry) => {
      if (!entry.request_id) {
        return;
      }

      const existingEntry = entryMap.get(entry.request_id);

      // No existing entry, add it
      if (!existingEntry || !existingEntry.created_at) {
        entryMap.set(entry.request_id, entry);
        return;
      }

      const newEntryIsMoreRecent =
        entry.created_at &&
        new Date(entry.created_at) < new Date(existingEntry.created_at);
      const newEntryHasVectors =
        (entry.request_body_vector && !existingEntry.request_body_vector) ||
        (entry.response_body_vector && !existingEntry.response_body_vector);

      if (newEntryIsMoreRecent || newEntryHasVectors) {
        entryMap.set(entry.request_id, entry);
      }
    });

    return Array.from(entryMap.values());
  }
}
