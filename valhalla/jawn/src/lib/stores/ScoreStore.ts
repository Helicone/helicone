import { err, ok, Result, resultMap } from "../../packages/common/result";
import { clickhouseDb, RequestResponseRMT } from "../db/ClickhouseWrapper";
import { dbExecute } from "../shared/db/dbExecute";
import { BaseStore } from "./baseStore";

export type Score = {
  score_attribute_key: string;
  score_attribute_type: "number" | "boolean";
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

    // TODO Use final instead of hand rolling deduplication
    let rowContents = resultMap(
      await clickhouseDb.dbQuery<RequestResponseRMT>(
        `
        SELECT *
        FROM request_response_rmt
        WHERE (request_id, organization_id) IN (${queryPlaceholders})
        AND request_created_at > now() - INTERVAL 30 DAY
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
    const uniqueRequestResponseLogs = rowContents.data.reduce(
      (acc, row) => {
        const key = `${row.request_id}-${row.organization_id}`;
        if (
          !acc[key] ||
          (row.updated_at &&
            (!acc[key].updated_at ||
              new Date(row.updated_at) > new Date(acc[key].updated_at!)))
        ) {
          acc[key] = row;
        }
        return acc;
      },
      {} as Record<string, RequestResponseRMT>
    );

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
          ...newVersion.mappedScores.reduce(
            (acc, score) => {
              if (!Number.isInteger(score.score_attribute_value)) {
                console.log(
                  `Skipping score ${score.score_attribute_key} with value ${score.score_attribute_value}`
                );
              } else {
                acc[score.score_attribute_key] = score.score_attribute_value;
              }
              return acc;
            },
            {} as Record<string, number>
          ),
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
            prompt_cache_write_tokens: row.prompt_cache_write_tokens,
            prompt_cache_read_tokens: row.prompt_cache_read_tokens,
            prompt_audio_tokens: row.prompt_audio_tokens,
            completion_audio_tokens: row.completion_audio_tokens,
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
            cache_enabled: row.cache_enabled,
            cache_reference_id: row.cache_reference_id,
            cost: row.cost,
            gateway_endpoint_version: row.gateway_endpoint_version,
            is_passthrough_billing: row.is_passthrough_billing,
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

  // DEPRECATED: This method previously bumped version in legacy Postgres request table.
  // The table no longer exists. Versioning is now handled in ClickHouse.
  public async bumpRequestVersion(
    requests: { id: string; organizationId: string }[]
  ): Promise<Result<UpdatedRequestVersion[], string>> {
    // No-op: Legacy Postgres table no longer exists
    return err(
      "Legacy request table no longer supported. Versioning handled in ClickHouse."
    );
  }
}
