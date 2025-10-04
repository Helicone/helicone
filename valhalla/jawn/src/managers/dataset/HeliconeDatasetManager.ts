import { Json } from "../../lib/db/database.types";
import { AuthParams } from "../../packages/common/auth/types";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { S3Client } from "../../lib/shared/db/s3Client";
import {
  Result,
  err,
  ok,
  promiseResultMap,
} from "../../packages/common/result";
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
  requests_count: number;
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
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT_PUBLIC ?? process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2",
    );
  }

  async getDatasets(params: {
    datasetIds?: string[];
  }): Promise<Result<HeliconeDataset[], string>> {
    let sql = `
      SELECT 
        hd.*,
        COUNT(hdr.id) AS requests_count
      FROM 
        helicone_dataset hd
      LEFT JOIN 
        helicone_dataset_row hdr ON hd.id = hdr.dataset_id
      WHERE 
        hd.organization = $1
        AND hd.dataset_type = 'helicone'
        AND hd.deleted_at IS NULL
    `;

    const values: any[] = [this.authParams.organizationId];

    if (params.datasetIds && params.datasetIds.length > 0) {
      sql += ` AND hd.id = ANY($2::uuid[])`;
      values.push(params.datasetIds);
    }

    sql += `
      GROUP BY hd.id
      ORDER BY hd.created_at DESC
    `;

    const result = await dbExecute<HeliconeDataset>(sql, values);

    if (result.error || !result.data) {
      return err(result.error);
    }

    return ok(
      result.data.map((d) => ({
        ...d,
        signed_url: this.s3Client.getSignedUrl(
          this.s3Client.getDatasetKey(
            d.id,
            d.id,
            this.authParams.organizationId,
          ),
        ),
      })),
    );
  }

  async query(datasetId: string, params: { offset: number; limit: number }) {
    const query = `
      SELECT 
        hdr.id,
        hdr.origin_request_id,
        hdr.dataset_id,
        hdr.created_at
      FROM helicone_dataset_row hdr
      JOIN helicone_dataset hd ON hd.id = hdr.dataset_id
      WHERE hdr.dataset_id = $1
      AND hdr.organization_id = $2
      AND hd.deleted_at IS NULL
      ORDER BY hdr.created_at DESC
      LIMIT ${params.limit}
      OFFSET ${params.offset}
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
              this.authParams.organizationId,
            ),
          ),
        })),
      );
    });
  }

  async count(datasetId: string): Promise<Result<number, string>> {
    const query = `
      SELECT COUNT(*)
      FROM helicone_dataset_row
      JOIN helicone_dataset hd ON hd.id = helicone_dataset_row.dataset_id
      WHERE dataset_id = $1
      AND organization_id = $2
      AND hd.deleted_at IS NULL
    `;

    const result = await dbExecute<{ count: number }>(query, [
      datasetId,
      this.authParams.organizationId,
    ]);

    return promiseResultMap(result, async (rows) => {
      return rows[0].count;
    });
  }

  async mutate(
    datasetId: string,
    params: MutateParams,
  ): Promise<Result<null, string>> {
    const { addRequests, removeRequests } = params;

    if (addRequests.length > 0) {
      const addResult = await this.addRequests(datasetId, addRequests);
      if (addResult.error) return addResult;
    }

    if (removeRequests.length > 0) {
      const removeResult = await this.removeRequests(datasetId, removeRequests);
      if (removeResult.error) return removeResult;
    }

    return ok(null);
  }

  async updateDatasetRequest(
    datasetId: string,
    requestId: string,
    params: {
      requestBody: Json;
      responseBody: Json;
    },
  ): Promise<Result<null, string>> {
    if (!requestId) return err("Request ID is required");
    if (!datasetId) return err("Dataset ID is required");
    const key = this.s3Client.getDatasetKey(
      datasetId,
      requestId,
      this.authParams.organizationId,
    );

    const updatedData = JSON.stringify({
      request: params.requestBody,
      response: params.responseBody,
    });

    const s3result = await this.s3Client.store(key, updatedData);

    if (s3result.error) return err(s3result.error);

    return ok(null);
  }

  private async addRequests(
    datasetId: string,
    addRequests: string[],
  ): Promise<Result<null, string>> {
    try {
      // Build the VALUES part of the query dynamically
      const values = addRequests
        .map((_, index) => `($1, $${index + 2}, $${addRequests.length + 2})`)
        .join(",");

      // Prepare parameters array with organization_id, request IDs, and dataset_id
      const params = [
        this.authParams.organizationId,
        ...addRequests,
        datasetId,
      ];

      const result = await dbExecute<{
        id: string;
        origin_request_id: string;
      }>(
        `INSERT INTO helicone_dataset_row (organization_id, origin_request_id, dataset_id)
         VALUES ${values}
         RETURNING id, origin_request_id`,
        params,
      );

      if (result.error || !result.data) {
        return err(result.error ?? "Failed to add requests to dataset");
      }

      const results = await Promise.all(
        result.data.map(async (row) => {
          const key = this.s3Client.getRequestResponseKey(
            row.origin_request_id,
            this.authParams.organizationId,
          );
          const newKey = this.s3Client.getDatasetKey(
            datasetId,
            row.id,
            this.authParams.organizationId,
          );
          return await this.s3Client.copyObject(key, newKey);
        }),
      );

      if (results.some((result) => result.error)) {
        return err(results.find((result) => result.error)?.error!);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to add requests to dataset: ${error}`);
    }
  }

  private async removeRequests(
    datasetId: string,
    removeRequests: string[],
  ): Promise<Result<null, string>> {
    try {
      // Build the placeholders for the IN clause
      const placeholders = removeRequests
        .map((_, index) => `$${index + 3}`)
        .join(",");

      const result = await dbExecute(
        `DELETE FROM helicone_dataset_row
         WHERE dataset_id = $1
         AND organization_id = $2
         AND id IN (${placeholders})`,
        [datasetId, this.authParams.organizationId, ...removeRequests],
      );

      if (result.error) {
        return err(result.error);
      }

      const removeResults = await Promise.all(
        removeRequests.map(async (request) => {
          const key = this.s3Client.getDatasetKey(
            datasetId,
            request,
            this.authParams.organizationId,
          );
          return await this.s3Client.remove(key);
        }),
      );

      if (removeResults.some((result) => result.error)) {
        return err(removeResults.find((result) => result.error)?.error!);
      }

      return ok(null);
    } catch (error) {
      return err(`Failed to remove requests from dataset: ${error}`);
    }
  }

  async deleteDataset(datasetId: string): Promise<Result<null, string>> {
    try {
      const sql = `
        UPDATE helicone_dataset
        SET deleted_at = now()
        WHERE id = $1
        AND organization = $2
        RETURNING id
      `;

      const result = await dbExecute<{ id: string }>(sql, [
        datasetId,
        this.authParams.organizationId,
      ]);

      if (result.error || !result.data || result.data.length === 0) {
        return err(
          result.error ?? "Failed to delete dataset or dataset not found",
        );
      }

      return ok(null);
    } catch (error) {
      return err(`Error deleting dataset: ${error}`);
    }
  }
}
