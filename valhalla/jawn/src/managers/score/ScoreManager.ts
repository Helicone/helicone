import { query } from "express";
import {
  clickhouseDb,
  InsertRequestResponseVersioned,
} from "../../lib/db/ClickhouseWrapper";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result, resultMap } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../lib/db/supabase";
import { a } from "js-tiktoken/dist/core-c3ffd518";

export class ScoreManager extends BaseManager {
  constructor(private orgId: string, authParams: AuthParams) {
    super(authParams);
  }
  public async addScores(
    requestId: string,
    scores: Record<string, number>
  ): Promise<Result<string, string>> {
    const res = await this.addScoresToRequest(requestId, scores);
    if (res.error || !res.data) {
      return err(`Error adding scores: ${res.error}`);
    }
    return ok(res.data);
  }

  private async addScoresToRequest(
    requestId: string,
    scores: Record<string, number>
  ): Promise<Result<string, string>> {
    try {
      const supabaseRequest = await this.putScoresIntoSupabase(
        requestId,
        scores
      );

      if (supabaseRequest.error || !supabaseRequest.data) {
        return err(supabaseRequest.error);
      }

      const request = await this.putScoresAndBumpVersion(requestId, scores);

      if (request.error || !request.data) {
        return err(request.error);
      }

      const requestInClickhouse = await this.putScoresIntoClickhouse({
        ...request.data[0],
        scores: scores,
      });

      if (requestInClickhouse.error || !requestInClickhouse.data) {
        return requestInClickhouse;
      }

      return { data: "Scores added to Clickhouse successfully", error: null };
    } catch (error: any) {
      return err(error.message);
    }
  }

  private async putScoresIntoSupabase(
    requestId: string,
    scores: Record<string, number>
  ) {
    try {
      const organizationId = this.authParams.organizationId;
      const scoreKeys = Object.keys(scores);
      const scoreValues = Object.values(scores);

      const { data: requestData, error: requestError } = await dbExecute(
        `SELECT id FROM request WHERE id = $1 AND helicone_org_id = $2`,
        [requestId, organizationId]
      );

      if (!requestData || requestError) {
        return err(`${requestId} not found in organization ${organizationId}`);
      }

      const organizationIds = Array(scoreKeys.length).fill(organizationId);

      const query = `
        WITH upserted_attributes AS (
            INSERT INTO score_attribute (score_key, organization)
            SELECT unnest($1::text[]), unnest($2::uuid[])
            ON CONFLICT (score_key, organization) DO UPDATE SET
                score_key = EXCLUDED.score_key
            RETURNING id
        ),
        inserted_values AS (
            INSERT INTO score_value (score_attribute, request_id, int_value)
            SELECT id, $3, unnest($4::bigint[])
            FROM upserted_attributes
            ON CONFLICT (score_attribute, request_id) DO NOTHING
            RETURNING *
        )
        SELECT * FROM inserted_values;
    `;

      const { data, error } = await dbExecute(query, [
        scoreKeys,
        organizationIds,
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

  private async putScoresIntoClickhouse(newVersion: {
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
        [newVersion.id, newVersion.version - 1, this.orgId, newVersion.provider]
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
          [newVersion.id, this.orgId, newVersion.provider]
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
          organization_id: this.orgId,
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

  private async putScoresAndBumpVersion(
    requestId: string,
    scores: Record<string, number>
  ) {
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
      [this.orgId, requestId]
    );
  }
}
