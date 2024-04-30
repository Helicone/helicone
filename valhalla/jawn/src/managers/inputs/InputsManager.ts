// src/users/usersService.ts
import {
  PromptCreateSubversionParams,
  PromptInputRecord,
  PromptQueryParams,
  PromptResult,
  PromptVersionResult,
  PromptsQueryParams,
  PromptsResult,
} from "../../controllers/public/promptController";
import { Result, err, promiseResultMap } from "../../lib/shared/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { buildFilterPostgres } from "../../lib/shared/filters/filters";
import { resultMap } from "../../lib/shared/result";
import { User } from "../../models/user";
import { BaseManager } from "../BaseManager";
import { S3Client } from "../../lib/shared/db/s3Client";

export class InputsManager extends BaseManager {
  async getInputs(
    limit: number,
    promptVersion: string,
    random?: boolean
  ): Promise<Result<PromptInputRecord[], string>> {
    const result = await dbExecute<PromptInputRecord>(
      `
      SELECT 
        prompt_input_record.id as id,
        prompt_input_record.inputs as inputs,
        prompt_input_record.source_request as source_request,
        prompt_input_record.prompt_version as prompt_version,
        prompt_input_record.created_at as created_at,
        response.body as response_body
      FROM prompt_input_record
      left join request on prompt_input_record.source_request = request.id
      left join response on response.request = request.id
      WHERE  request.helicone_org_id = $1 AND
      prompt_input_record.prompt_version = $2
      ${
        random
          ? "ORDER BY random()"
          : "ORDER BY prompt_input_record.created_at DESC"
      }
      LIMIT $3

      `,
      [this.authParams.organizationId, promptVersion, limit]
    );

    const s3Client = new S3Client(
      process.env.S3_ACCESS_KEY ?? "",
      process.env.S3_SECRET_KEY ?? "",
      process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? ""
    );

    return promiseResultMap(result, async (data) => {
      return Promise.all(
        data.map(async (record) => {
          return {
            ...record,
            inputs: (
              await Promise.all(
                Object.entries(record.inputs).map(async ([key, value]) => {
                  if (value.includes("helicone-asset-id")) {
                    const regex = /<helicone-asset-id key="([^"]+)"\s*\/>/g;
                    const heliconeAssetIdKey = regex.exec(value)![1];
                    const signedUrl =
                      await s3Client.getRequestResponseImageSignedUrl(
                        this.authParams.organizationId,
                        record.source_request,
                        heliconeAssetIdKey
                      );

                    return {
                      key,
                      value: signedUrl.data ?? "",
                    };
                  }
                  return { key, value };
                })
              )
            ).reduce((acc, { key, value }) => {
              return {
                ...acc,
                [key]: value,
              };
            }, {} as PromptInputRecord["inputs"]),
          };
        })
      );
    });
  }
}
