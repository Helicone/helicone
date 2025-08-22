import pgPromise from "pg-promise";
import { PromiseGenericResult, err, ok } from "../../packages/common/result";
import { BatchPayload } from "../handlers/LoggingHandler";

import { Prompt2025Input } from "../db/ClickhouseWrapper";
import { HELICONE_DB as db, HELICONE_PGP as pgp } from "../shared/db/pgpClient";

process.on("exit", () => {
  pgp.end();
});

export class LogStore {
  constructor() {}

  async insertLogBatch(payload: BatchPayload): PromiseGenericResult<string> {
    try {
      await db.tx(async (t: pgPromise.ITask<{}>) => {
        if (
          payload.orgsToMarkAsIntegrated &&
          payload.orgsToMarkAsIntegrated.size > 0
        ) {
          try {
            for (const orgId of payload.orgsToMarkAsIntegrated) {
              await t.none(
                `UPDATE organization 
                SET has_integrated = true,
                has_onboarded = true
                WHERE id = $1 AND has_integrated = false`,
                [orgId]
              );
            }
          } catch (error) {
            console.error(
              "Error updating organization onboarding status:",
              error
            );
            // Don't fail the transaction if onboarding update fails
          }
        }

        if (payload.promptInputs && payload.promptInputs.length > 0) {
          const result = await this.processPromptInputsBatch(
            payload.promptInputs,
            t
          );
          if (result.error) {
            console.error(
              "Error processing prompt inputs batch:",
              result.error
            );
          }
        }
      });

      return ok("Successfully inserted log batch");
    } catch (error: any) {
      return err("Failed to insert log batch: " + error);
    }
  }

  async processPromptInputsBatch(
    promptInputs: Prompt2025Input[],
    t: pgPromise.ITask<{}>
  ): PromiseGenericResult<string> {
    if (promptInputs.length === 0) {
      return ok("No prompt inputs to process");
    }

    const versionIds = [
      ...new Set(promptInputs.map((input) => input.version_id)),
    ];

    const existingVersions = await t.manyOrNone<{ id: string }>(
      `SELECT id FROM prompts_2025_versions WHERE id = ANY($1::uuid[])`,
      [versionIds]
    );

    const existingVersionIds = new Set(existingVersions.map((v) => v.id));
    const validInputs = promptInputs.filter((input) =>
      existingVersionIds.has(input.version_id)
    );
    const invalidInputs = promptInputs.filter(
      (input) => !existingVersionIds.has(input.version_id)
    );

    if (validInputs.length === 0) {
      return err("No valid prompt versions found");
    }

    try {
      const cs = new pgp.helpers.ColumnSet(
        ["request_id", "version_id", "inputs", "environment"],
        { table: "prompts_2025_inputs" }
      );

      const query = pgp.helpers.insert(validInputs, cs);
      await t.none(query);

      if (invalidInputs.length > 0) {
        console.warn(
          `Skipped ${invalidInputs.length} prompt inputs due to invalid version IDs:`,
          invalidInputs.map((input) => input.version_id)
        );
      }

      const message =
        invalidInputs.length > 0
          ? `Processed ${validInputs.length} inputs successfully. ${invalidInputs.length} inputs skipped due to invalid version IDs.`
          : `All ${validInputs.length} inputs processed successfully`;

      return ok(message);
    } catch (error) {
      console.error("Error batch inserting prompt inputs", error);
      return err("Failed to batch insert prompt inputs");
    }
  }
}
