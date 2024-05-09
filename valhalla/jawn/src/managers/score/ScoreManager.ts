import { query } from 'express';
import { clickhouseDb, InsertRequestResponseVersioned } from '../../lib/db/ClickhouseWrapper';
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, Result, resultMap } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";

export class ScoreManager extends BaseManager {
  constructor(private orgId: string) {}
  public async addScores(
    requestId: string,
    scores: Record<string, number>
  ): Promise<Result<string, string>> {
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

  private async addScoresToRequest(
    requestId: string,
    scores: Record<string, number>
  ): Promise<Result<string, string>> {
    try {
      const organizationId = this.authParams.organizationId;
      const scoreKeys = Object.keys(scores);
      const scoreValues = Object.values(scores);

      const request = await this.putScoresAndBumpVersion(requestId, scores);

      if (request.error || !request.data) {
        return err(request.error);
      }

      const { data, error } = await dbExecute(query, [
        requestId,
        organizationId,
        scoreKeys,
        scoreValues,
      ]);

      if (!data || error) {
        return err(`Error adding scores to Clickhouse: ${error}`);
      }

      return { data: "Scores added to Clickhouse successfully", error: null };
    } catch (error: any) {
      return err(error.message);
    }
  }

  private async putScoresIntoClickhouse(newVersion: {
    id: string;
    version: number;
    scores: Record<string, string>;
  }): Promise<Result<string, string>> {
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
  }

  private async putScoresAndBumpVersion(
    requestId: string,
    scores: Record<string, number>
  ) {
    return await dbExecute<{
      id: string;
      version: number;
      scores: Record<string, string>;
    }>(
      `
          UPDATE request
          SET scores = scores || $1,
              version = version + 1
          WHERE helicone_org_id = $2
          AND id = $3
          RETURNING version, id, scores
          `,
      [{ scores }, organizationId, requestId]
    );
  }
}
