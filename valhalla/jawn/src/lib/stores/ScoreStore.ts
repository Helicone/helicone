import { RequestResponseRMT, clickhouseDb } from "../db/ClickhouseWrapper";
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
  ): Promise<Result<RequestResponseRMT[], string>> {
    const queryPlaceholders = newVersions
      .map((_, index) => {
        const base = index * 2;
        return `({val_${base} : String}, {val_${base + 1} : String})`;
      })
      .join(",\n    ");

    if (queryPlaceholders.length === 0) {
      return err("No query placeholders");
    }

    const queryParams: (string | number | boolean | Date)[] =
      newVersions.flatMap((v) => [v.requestId, v.organizationId]);

    if (queryParams.length === 0) {
      return err("No query params");
    }

    let rowContents = resultMap(
      await clickhouseDb.dbQuery<RequestResponseRMT>(
        `
        SELECT *
        FROM request_response_rmt
        WHERE (request_id, organization_id) IN (${queryPlaceholders})
        `,
        queryParams
      ),
      (x) => x
    );

    if (rowContents.error || !rowContents.data) {
      return err(
        `Could not find previous versions of all requests, requestId-orgId: ${newVersions
          .map((v) => `${v.requestId}-${v.organizationId}`)
          .join(", ")}`
      );
    }
    const uniqueRequestResponseLogs = rowContents.data.reduce((acc, row) => {
      const key = `${row.request_id}-${row.organization_id}`;
      if (
        !acc[key] ||
        (row.updated_at &&
          (!acc[key].updated_at ||
            new Date(row.updated_at) > new Date(acc[key].updated_at)))
      ) {
        acc[key] = row;
      }
      return acc;
    }, {} as Record<string, RequestResponseRMT>);

    const filteredRequestResponseLogs = Object.values(
      uniqueRequestResponseLogs
    );

    const res = await clickhouseDb.dbInsertClickhouse(
      "request_response_rmt",
      filteredRequestResponseLogs.flatMap((row, index) => {
        const newVersion = newVersions[index];

        // Merge existing scores with new scores
        const combinedScores = {
          ...(row.scores || {}),
          ...newVersion.mappedScores.reduce((acc, score) => {
            if (!Number.isInteger(score.score_attribute_value)) {
              console.log(
                `Skipping score ${score.score_attribute_key} with value ${score.score_attribute_value}`
              );
            } else {
              acc[score.score_attribute_key] = score.score_attribute_value;
            }
            return acc;
          }, {} as Record<string, number>),
        };

        // Validate and ensure the scores are in the correct format
        const validScores = Object.entries(combinedScores).reduce(
          (acc, [key, value]) => {
            if (key && value !== null && value !== undefined) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, number>
        );
        return [
          {
            response_id: row.response_id,
            response_created_at: row.response_created_at,
            latency: row.latency,
            status: row.status,
            completion_tokens: row.completion_tokens,
            prompt_tokens: row.prompt_tokens,
            model:
              row.model && row.model !== ""
                ? row.model
                : this.getModelFromPath(row.target_url),
            request_id: row.request_id,
            request_created_at: row.request_created_at,
            user_id: row.user_id,
            organization_id: row.organization_id,
            proxy_key_id: row.proxy_key_id,
            threat: row.threat,
            time_to_first_token: row.time_to_first_token,
            provider: row.provider,
            country_code: row.country_code,
            target_url: row.target_url,
            properties: row.properties,
            request_body: row.request_body,
            response_body: row.response_body,
            assets: row.assets,
            scores: validScores,
          },
        ];
      })
    );

    if (res.error) {
      console.error("dbInsertClickhouse Error:", res.error);
      return err(res.error);
    }

    return ok(filteredRequestResponseLogs);
  }

  private getModelFromPath(path: string): string {
    const regex1 = /\/engines\/([^/]+)/;
    const regex2 = /models\/([^/:]+)/;

    let match = path.match(regex1);

    if (!match) {
      match = path.match(regex2);
    }

    if (match && match[1]) {
      return match[1];
    }

    return "";
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
    if (feedbacks.length === 0) {
      return ok([]);
    }

    const validFeedbacks = feedbacks.filter(
      (feedback) =>
        feedback.responseId !== "00000000-0000-0000-0000-000000000000"
    );

    console.log(
      `Upserting feedback for ${
        validFeedbacks.length
      } responses, responseIds: ${validFeedbacks
        .map((f) => f.responseId)
        .join(", ")}`
    );

    const placeholders = validFeedbacks
      .map(
        (_, index) =>
          `($${index * 3 + 1}::uuid, $${index * 3 + 2}::boolean, $${
            index * 3 + 3
          }::timestamp)`
      )
      .join(", ");

    const values = validFeedbacks.flatMap((feedback) => [
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
