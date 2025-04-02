// src/users/usersController.ts
import * as Sentry from "@sentry/node";
import {
  Body,
  Controller,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { postHogClient } from "../../lib/clients/postHogClient";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { getRequests } from "../../lib/stores/request/request";
import { FineTuningManager } from "../../managers/FineTuningManager";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface GenerateHashQueryParams {
  apiKey: string;
  userId: string;
  keyName: string;
}

export async function hasAccessToFineTune(orgId: string): Promise<boolean> {
  const orgResult = await dbExecute<{ id: string; tier: string }>(
    `SELECT id, tier FROM organization WHERE id = $1`,
    [orgId]
  );

  if (orgResult.error || !orgResult.data || orgResult.data.length === 0) {
    return false;
  }

  const org = orgResult.data[0];

  if (!org.tier) {
    return false;
  }

  if (org.tier === "free") {
    const jobCountResult = await dbExecute<{ count: number }>(
      `SELECT COUNT(*) as count FROM finetune_job WHERE organization_id = $1`,
      [orgId]
    );

    const jobsCount = jobCountResult.data?.[0]?.count ?? 1;
    if (jobsCount >= 1) {
      return false;
    } else {
      return true;
    }
  }
  return true;
}

export type FineTuneResult =
  | {
      error: string;
    }
  | {
      success: boolean;
      data: {
        fineTuneJob: string;
        url: string;
      };
    };

export interface FineTuneBodyParams {
  providerKeyId: string;
}

@Route("v1/dataset")
@Tags("Dataset")
@Security("api_key")
export class DatasetController extends Controller {
  @Post("{datasetId}/fine-tune")
  @Tags("FineTune")
  public async datasetFineTune(
    @Path() datasetId: string,
    @Body()
    body: FineTuneBodyParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<FineTuneResult> {
    if (!(await hasAccessToFineTune(request.authParams.organizationId))) {
      this.setStatus(403);
      return {
        error: "You do not have access to fine tune",
      };
    }

    const { providerKeyId } = body;
    const datasetResult = await dbExecute<{
      id: string;
      filter_node: string;
    }>(`SELECT id, filter_node FROM finetune_dataset WHERE id = $1`, [
      datasetId,
    ]);

    if (
      datasetResult.error ||
      !datasetResult.data ||
      datasetResult.data.length === 0
    ) {
      this.setStatus(404);
      return {
        error: "No dataset found",
      };
    }

    const dataset = datasetResult.data[0];
    let filterNode: FilterNode;

    try {
      filterNode = JSON.parse(dataset?.filter_node ?? "");
    } catch (e) {
      this.setStatus(500);
      return {
        error: "No dataset found",
      };
    }

    const metrics = await getRequests(
      request.authParams.organizationId,
      filterNode,
      0,
      1000,
      {}
    );

    if (metrics.error || !metrics.data || metrics.data.length === 0) {
      this.setStatus(404);
      return {
        error: "No requests found",
      };
    }

    const keyResult = await dbExecute<{
      decrypted_provider_key: string;
    }>(
      `SELECT decrypted_provider_key FROM decrypted_provider_keys 
       WHERE id = $1 AND org_id = $2`,
      [providerKeyId, request.authParams.organizationId]
    );

    if (
      keyResult.error ||
      !keyResult.data ||
      keyResult.data.length === 0 ||
      !keyResult.data[0].decrypted_provider_key
    ) {
      this.setStatus(404);
      return {
        error: "No Provider key found",
      };
    }

    const fineTuningManager = new FineTuningManager(
      keyResult.data[0].decrypted_provider_key
    );
    try {
      const fineTuneJob = await fineTuningManager.createFineTuneJob(
        metrics.data,
        "model",
        "suffix"
      );

      if (fineTuneJob.error || !fineTuneJob.data) {
        this.setStatus(500);
        return {
          error: "Failed to create fine tune job",
        };
      }

      const url = `https://platform.openai.com/finetune/${fineTuneJob.data.id}?filter=all`;
      Sentry.captureMessage(
        `fine-tune job created - ${fineTuneJob.data.id} - ${request.authParams.organizationId}`
      );

      postHogClient?.capture({
        distinctId: `${fineTuneJob.data.id}-${request.authParams.organizationId}`,
        event: "fine_tune_job",
        properties: {
          id: fineTuneJob.data.id,
          success: true,
          org_id: request.authParams.organizationId,
        },
      });

      const insertResult = await dbExecute<{ id: string }>(
        `INSERT INTO finetune_job 
         (dataset_id, finetune_job_id, provider_key_id, status, organization_id) 
         VALUES ($1, $2, $3, 'created', $4) 
         RETURNING id`,
        [
          dataset.id,
          fineTuneJob.data.id,
          providerKeyId,
          request.authParams.organizationId,
        ]
      );

      return {
        success: true,
        data: {
          fineTuneJob: insertResult.data?.[0]?.id ?? "",
          url: url,
        },
      };
    } catch (e) {
      Sentry.captureException(e);
      postHogClient?.capture({
        distinctId: `${request.authParams.organizationId}`,
        event: "fine_tune_job",
        properties: {
          success: false,
          org_id: request.authParams.organizationId,
        },
      });

      this.setStatus(500);
      return {
        error:
          "Sorry the fine tuning job you requested failed. Right now it is in beta and only support gpt3.5 and gpt4 requests",
      };
    }
  }
}
