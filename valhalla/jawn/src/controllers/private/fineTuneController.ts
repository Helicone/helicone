// src/users/usersController.ts
import * as Sentry from "@sentry/node";
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { postHogClient } from "../../lib/clients/postHogClient";
import { getRequests } from "../../lib/stores/request/request";
import { FineTuningManager } from "../../managers/FineTuningManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { Result, err, ok } from "../../lib/shared/result";

// src/users/usersController.ts
import { hasAccessToFineTune } from "./datasetController";

export interface FineTuneBody {
  providerKeyId: string;
}

@Route("/v1/fine-tune")
@Tags("FineTune")
@Security("api_key")
export class FineTuneMainController extends Controller {
  @Post("/")
  public async fineTune(
    @Body()
    body: FineTuneBody,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    | {
        error: string;
      }
    | {
        success: boolean;
        data: {
          fineTuneJob: string;
          url: string;
        };
      }
  > {
    if (!(await hasAccessToFineTune(request.authParams.organizationId))) {
      this.setStatus(403);
      return {
        error: "You do not have access to fine tune",
      };
    }
    const filter = "all";
    const { providerKeyId } = body;
    const metrics = await getRequests(
      request.authParams.organizationId,
      filter,
      0,
      1000,
      {}
    );
    if (metrics.error || !metrics.data || metrics.data.length === 0) {
      this.setStatus(500);
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
      this.setStatus(500);
      return {
        error: "No Provider Key found",
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

      const datasetResult = await dbExecute<{ id: string }>(
        `INSERT INTO finetune_dataset
         (name, filters, organization_id)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [
          `Automated Dataset for ${fineTuneJob.data.id}`,
          JSON.stringify([]),
          request.authParams.organizationId,
        ]
      );

      if (
        datasetResult.error ||
        !datasetResult.data ||
        datasetResult.data.length === 0
      ) {
        this.setStatus(500);
        return {
          error: datasetResult.error || "Failed to create dataset",
        };
      }

      const fineTuneJobResult = await dbExecute<{ id: string }>(
        `INSERT INTO finetune_job
         (dataset_id, finetune_job_id, provider_key_id, status, organization_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          datasetResult.data[0].id,
          fineTuneJob.data.id,
          providerKeyId,
          "created",
          request.authParams.organizationId,
        ]
      );

      return {
        success: true,
        data: {
          fineTuneJob: fineTuneJobResult.data?.[0]?.id ?? "",
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

  @Get("{jobId}/stats")
  public async fineTuneJobStats(
    @Path() jobId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    | {
        error: string;
      }
    | {
        job: any;
        events: any;
      }
  > {
    const fineTuneJobResult = await dbExecute<{
      id: string;
      provider_key_id: string;
      finetune_job_id: string;
    }>(
      `SELECT id, provider_key_id, finetune_job_id
       FROM finetune_job
       WHERE id = $1 AND organization_id = $2`,
      [jobId ?? "", request.authParams.organizationId]
    );

    if (
      fineTuneJobResult.error ||
      !fineTuneJobResult.data ||
      fineTuneJobResult.data.length === 0
    ) {
      this.setStatus(404);
      return {
        error: "No fine tune job found",
      };
    }

    const fineTuneJob = fineTuneJobResult.data[0];

    const keyResult = await dbExecute<{
      decrypted_provider_key: string;
    }>(
      `SELECT decrypted_provider_key
       FROM decrypted_provider_keys
       WHERE id = $1 AND org_id = $2`,
      [fineTuneJob.provider_key_id, request.authParams.organizationId]
    );

    if (
      keyResult.error ||
      !keyResult.data ||
      keyResult.data.length === 0 ||
      !keyResult.data[0].decrypted_provider_key
    ) {
      this.setStatus(404);
      return {
        error: "No key found",
      };
    }

    const fineTuningManager = new FineTuningManager(
      keyResult.data[0].decrypted_provider_key
    );
    const fineTuneJobData = await fineTuningManager.getFineTuneJob(
      fineTuneJob.finetune_job_id
    );

    if (fineTuneJobData.error || !fineTuneJobData.data) {
      this.setStatus(500);
      return {
        error: "Failed to get fine tune job",
      };
    }

    this.setStatus(200);
    return fineTuneJobData.data;
  }
}
