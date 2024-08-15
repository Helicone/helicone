import {
  InsertRequestResponseVersioned,
  clickhouseDb,
} from "../db/ClickhouseWrapper";
import { dbExecute } from "../shared/db/dbExecute";
import { err, resultMap, ok, Result } from "../shared/result";
import { BaseStore } from "./baseStore";

export type Score = {
  score_attribute_key: string;
  score_attribute_type: string;
  score_attribute_value: number;
};

export interface BatchScores {
  requestId: string;
  version: number;
  provider: string;
  organizationId: string;
  mappedScores: Score[];
}

export interface UpdatedRequestVersion {
  id: string;
  version: number;
  provider: string;
  helicone_org_id: string;
}

export interface UpdatedFeedback {
  id: string;
  response_id: string;
  rating: boolean;
  created_at: string;
}

export class ScoreStore extends BaseStore {
  constructor(organizationId: string) {
    super(organizationId);
  }

  public async putScoresIntoSupabase(requestId: string, scores: Score[]) {
    try {
      const scoreKeys = scores.map((score) => score.score_attribute_key);
      const scoreTypes = scores.map((score) => score.score_attribute_type);
      const scoreValues = scores.map((score) => score.score_attribute_value);

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
            INSERT INTO score_attribute (score_key, value_type, organization)
            SELECT unnest($1::text[]), unnest($2::text[]), unnest($3::uuid[])
            ON CONFLICT (score_key, organization) DO UPDATE SET
                score_key = EXCLUDED.score_key,
                value_type = EXCLUDED.value_type
            RETURNING id, score_key
        )
        SELECT id, score_key
        FROM upserted_attributes;
      `;

      const { data: upsertedAttributes, error: upsertError } = await dbExecute(
        upsertQuery,
        [scoreKeys, scoreTypes, organizationIds]
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

  public async putScoresIntoClickhouse(
    newVersions: BatchScores[]
  ): Promise<Result<InsertRequestResponseVersioned[], string>> {
    const queryPlaceholders = newVersions
      .map((_, index) => {
        const base = index * 4;
        return `({val_${base} : String}, {val_${base + 1} : String}, {val_${
          base + 2
        } : String}, {val_${base + 3} : UInt64})`;
      })
      .join(",\n    ");

    if (queryPlaceholders.length === 0) {
      return err("No query placeholders");
    }

    const queryParams: (string | number | boolean | Date)[] =
      newVersions.flatMap((v) => [
        v.requestId,
        v.organizationId,
        v.provider,
        v.version - 1,
      ]);

    if (queryParams.length === 0) {
      return err("No query params");
    }

    let rowContents = resultMap(
      await clickhouseDb.dbQuery<InsertRequestResponseVersioned>(
        `
        SELECT *
        FROM request_response_versioned
        WHERE (request_id, organization_id, provider, version) IN (${queryPlaceholders})
        `,
        queryParams
      ),
      (x) => x
    );

    if (
      rowContents.error ||
      !rowContents.data ||
      rowContents.data.length !== newVersions.length
    ) {
      // Fetch the latest versions for missing rows
      const missingVersions = newVersions.filter(
        (v) =>
          !rowContents.data?.some(
            (row) =>
              row.request_id === v.requestId &&
              row.organization_id === v.organizationId &&
              row.provider === v.provider
          )
      );

      if (missingVersions.length > 0) {
        const missingQueryPlaceholders = missingVersions
          .map((_, index) => {
            const base = index * 3;
            return `({val_${base} : String}, {val_${base + 1} : String}, {val_${
              base + 2
            } : String})`;
          })
          .join(", ");

        const missingQueryParams = missingVersions.flatMap((v) => [
          v.requestId,
          v.organizationId,
          v.provider,
        ]);

        const missingRowContents = resultMap(
          await clickhouseDb.dbQuery<InsertRequestResponseVersioned>(
            `
            SELECT *
            FROM request_response_versioned
            WHERE (request_id, organization_id, provider) IN (${missingQueryPlaceholders})
            ORDER BY version DESC
            LIMIT ${missingVersions.length}
            `,
            missingQueryParams
          ),
          (x) => x
        );

        if (missingRowContents.error || !missingRowContents.data) {
          return err(
            `Could not find previous versions of some requests, requestId-orgId: ${missingVersions
              .map((v) => `${v.requestId}-${v.organizationId}`)
              .join(", ")}`
          );
        }

        rowContents.data = [
          ...(rowContents.data || []),
          ...missingRowContents.data,
        ];
      }
    }

    if (rowContents.error || !rowContents.data) {
      return err(
        `Could not find previous versions of all requests, requestId-orgId: ${newVersions
          .map((v) => `${v.requestId}-${v.organizationId}`)
          .join(", ")}`
      );
    }

    const res = await clickhouseDb.dbInsertClickhouse(
      "request_response_versioned",
      rowContents.data.flatMap((row, index) => {
        const newVersion = newVersions[index];
        return [
          // Delete the previous version
          {
            sign: -1,
            version: row.version,
            request_id: newVersion.requestId,
            organization_id: newVersion.organizationId,
            provider: newVersion.provider,
            model: row.model,
            request_created_at: row.request_created_at,
          },
          // Insert the new version
          {
            ...row,
            sign: 1,
            version: newVersion.version,
            scores: {
              ...row.scores,
              ...newVersion.mappedScores.reduce((acc, score) => {
                acc[score.score_attribute_key] = score.score_attribute_value;
                return acc;
              }, {} as Record<string, number>),
            },
          },
        ];
      })
    );

    if (res.error) {
      return err(res.error);
    }

    return ok(rowContents.data);
  }

  public async bumpRequestVersion(
    requests: { id: string; organizationId: string }[]
  ): Promise<Result<UpdatedRequestVersion[], string>> {
    const placeholders = requests
      .map((_, index) => `($${index * 2 + 1}::uuid, $${index * 2 + 2}::uuid)`)
      .join(", ");

    const values = requests.flatMap((request) => [
      request.organizationId,
      request.id,
    ]);

    const query = `
      UPDATE request AS r
      SET version = r.version + 1
      FROM (VALUES ${placeholders}) AS v(org_id, req_id)
      WHERE r.helicone_org_id = v.org_id AND r.id = v.req_id
      RETURNING r.id, r.version, r.provider, r.helicone_org_id
    `;

    const result = await dbExecute<UpdatedRequestVersion>(query, values);

    return result;
  }

  public async bulkUpsertFeedback(
    feedbacks: { responseId: string; rating: boolean }[]
  ): Promise<Result<UpdatedFeedback[], string>> {
    console.log(
      `Upserting feedback for ${
        feedbacks.length
      } responses, responseIds: ${feedbacks
        .map((f) => f.responseId)
        .join(", ")}`
    );

    const placeholders = feedbacks
      .map(
        (_, index) =>
          `($${index * 3 + 1}::uuid, $${index * 3 + 2}::boolean, $${
            index * 3 + 3
          }::timestamp)`
      )
      .join(", ");

    const values = feedbacks.flatMap((feedback) => [
      feedback.responseId,
      feedback.rating,
      new Date().toISOString(),
    ]);

    const query = `
    INSERT INTO feedback (response_id, rating, created_at)
    VALUES ${placeholders}
    ON CONFLICT (response_id)
    DO UPDATE SET
      rating = EXCLUDED.rating,
      created_at = EXCLUDED.created_at
    RETURNING id, response_id, rating, created_at
  `;

    return await dbExecute<UpdatedFeedback>(query, values);
  }
}
