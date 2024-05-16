import {
  InsertRequestResponseVersioned,
  clickhouseDb,
} from "../db/ClickhouseWrapper";
import { dbExecute } from "../shared/db/dbExecute";
import { err, resultMap, ok, Result } from "../shared/result";
import { BaseStore } from "./baseStore";

export class ScoreStore extends BaseStore {
  constructor(organizationId: string) {
    super(organizationId);
  }

  public async putScoresIntoSupabase(
    requestId: string,
    scores: Record<string, number>
  ) {
    try {
      const scoreKeys = Object.keys(scores);
      const scoreValues = Object.values(scores).map((val) => BigInt(val));

      const { data: requestData, error: requestError } = await dbExecute(
        `SELECT id FROM request WHERE id = $1 AND helicone_org_id = $2`,
        [requestId, this.organizationId]
      );

      if (!requestData || requestError) {
        return err(
          `${requestId} not found in organization ${this.organizationId}`
        );
      }

      const organizationIds = Array(scoreKeys.length).fill(this.organizationId);

      const upsertQuery = `
        WITH upserted_attributes AS (
            INSERT INTO score_attribute (score_key, organization)
            SELECT unnest($1::text[]), unnest($2::uuid[])
            ON CONFLICT (score_key, organization) DO UPDATE SET
                score_key = EXCLUDED.score_key
            RETURNING id, score_key
        )
        SELECT id, score_key
        FROM upserted_attributes;
      `;

      const { data: upsertedAttributes, error: upsertError } = await dbExecute(
        upsertQuery,
        [scoreKeys, organizationIds]
      );

      if (!upsertedAttributes || upsertError) {
        return err(`Error upserting attributes: ${upsertError}`);
      }

      const attributeIds = upsertedAttributes.map((attr: any) => attr.id);

      const insertValuesQuery = `
        INSERT INTO score_value (score_attribute, request_id, int_value)
        SELECT unnest($1::uuid[]), $2, unnest($3::bigint[])
        ON CONFLICT (score_attribute, request_id) DO NOTHING
        RETURNING *;
      `;

      const { data, error } = await dbExecute(insertValuesQuery, [
        attributeIds,
        requestId,
        scoreValues,
      ]);

      if (!data || error) {
        return err(`Error adding scores: ${error}`);
      }

      return { data: "Scores added successfully", error: null };
    } catch (error: any) {
      return err(error.message);
    }
  }

  public async putScoresIntoClickhouse(newVersion: {
    id: string;
    version: number;
    provider: string;
    scores: Record<string, number>;
  }): Promise<Result<InsertRequestResponseVersioned, string>> {
    let rowContents = resultMap(
      await clickhouseDb.dbQuery<InsertRequestResponseVersioned>(
        `
      SELECT *
      FROM request_response_versioned
      WHERE request_id = {val_0: UUID}
      AND version = {val_1: UInt64}
      AND organization_id = {val_2: String}
      AND provider = {val_3: String}
    `,
        [
          newVersion.id,
          newVersion.version - 1,
          this.organizationId,
          newVersion.provider,
        ]
      ),
      (x) => x[0]
    );

    if (rowContents.error) {
      return rowContents;
    }
    if (!rowContents.data) {
      rowContents = resultMap(
        await clickhouseDb.dbQuery<InsertRequestResponseVersioned>(
          `
        SELECT *
        FROM request_response_versioned
        WHERE request_id = {val_0: UUID}
        AND organization_id = {val_1: String}
        AND provider = {val_2: String}
        ORDER BY version DESC
        LIMIT 1
      `,
          [newVersion.id, this.organizationId, newVersion.provider]
        ),
        (x) => x[0]
      );
    }

    if (rowContents.error || !rowContents.data) {
      return err("Could not find previous version of request");
    }

    const res = await clickhouseDb.dbInsertClickhouse(
      "request_response_versioned",
      [
        // Delete the previous version
        {
          sign: -1,
          version: rowContents.data.version,
          request_id: newVersion.id,
          organization_id: this.organizationId,
          provider: newVersion.provider,
          model: rowContents.data.model,
          request_created_at: rowContents.data.request_created_at,
        },
        // Insert the new version
        {
          ...rowContents.data,
          sign: 1,
          version: newVersion.version,
          scores: newVersion.scores,
        },
      ]
    );
    if (res.error) {
      return err(res.error);
    }

    return ok(rowContents.data);
  }

  public async bumpRequestVersion(requestId: string) {
    return await dbExecute<{
      id: string;
      version: number;
      provider: string;
    }>(
      `
          UPDATE request
          SET version = version + 1
          WHERE helicone_org_id = $1
          AND id = $2
          RETURNING version, id, provider
          `,
      [this.organizationId, requestId]
    );
  }
}
