// src/users/usersService.ts
import { Json } from "../../lib/db/database.types";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { S3Client } from "../../lib/shared/db/s3Client";
import { Result, err, ok, promiseResultMap } from "../../lib/shared/result";
import { BaseManager } from "../BaseManager";

export interface MutateParams {
  addRequests: string[];
  removeRequests: string[];
}

export interface HeliconeDataset {
  created_at: string | null;
  dataset_type: string;
  id: string;
  meta: Json | null;
  name: string | null;
  organization: string;
}

export interface HeliconeDatasetRow {
  id: string;
  origin_request_id: string;
  dataset_id: string;
  created_at: string;
  signed_url: Result<string, string>;
}

export class HeliconeDatasetManager extends BaseManager {
  private s3Client: S3Client;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY ?? "",
      process.env.S3_SECRET_KEY ?? "",
      process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  async getDatasets(params: {
    datasetIds?: string[];
  }): Promise<Result<HeliconeDataset[], string>> {
    let query = supabaseServer.client
      .from("helicone_dataset")
      .select("*")
      .eq("organization", this.authParams.organizationId)
      .eq("dataset_type", "helicone");
    if (params.datasetIds) {
      query = query.in("id", params.datasetIds);
    }
    const { data, error } = await query;

    if (error) {
      return err(error.message);
    }

    return ok(
      data.map((d) => ({
        ...d,
        signed_url: this.s3Client.getSignedUrl(
          this.s3Client.getDatasetKey(
            d.id,
            d.id,
            this.authParams.organizationId
          )
        ),
      }))
    );
  }

  async query(datasetId: string, params: {}) {
    const query = `
      SELECT 
        hdr.id,
        hdr.origin_request_id,
        hdr.dataset_id,
        hdr.created_at
      FROM helicone_dataset_row hdr
      WHERE hdr.dataset_id = $1
      AND hdr.organization_id = $2
      ORDER BY hdr.created_at DESC
    `;

    const result = await dbExecute<HeliconeDatasetRow>(query, [
      datasetId,
      this.authParams.organizationId,
    ]);

    return promiseResultMap(result, async (rows) => {
      return Promise.all(
        rows.map(async (row) => ({
          ...row,
          signed_url: await this.s3Client.getSignedUrl(
            this.s3Client.getDatasetKey(
              row.dataset_id,
              row.id,
              this.authParams.organizationId
            )
          ),
        }))
      );
    });
  }

  async mutate(
    datasetId: string,
    params: MutateParams
  ): Promise<Result<null, string>> {
    const { addRequests, removeRequests } = params;

    const { data, error } = await supabaseServer.client
      .from("helicone_dataset_row")
      .insert([
        ...addRequests.map((request) => ({
          organization_id: this.authParams.organizationId,
          origin_request_id: request,
          dataset_id: datasetId,
        })),
      ])
      .select("*");

    if (error) {
      return err(error.message);
    }

    const results = await Promise.all(
      data.map(async (row) => {
        const key = this.s3Client.getRequestResponseKey(
          row.origin_request_id,
          this.authParams.organizationId
        );

        const newKey = this.s3Client.getDatasetKey(
          datasetId,
          row.id,
          this.authParams.organizationId
        );

        return await this.s3Client.copyObject(key, newKey);
      })
    );

    if (results.some((result) => result.error)) {
      return err(results.find((result) => result.error)?.error!);
    }

    const removeResults = await Promise.all(
      removeRequests.map(async (request) => {
        const key = this.s3Client.getDatasetKey(
          datasetId,
          request,
          this.authParams.organizationId
        );
        return await this.s3Client.remove(key);
      })
    );

    if (removeResults.some((result) => result.error)) {
      return err(removeResults.find((result) => result.error)?.error!);
    }

    return ok(null);
  }
}
