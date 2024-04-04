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
import { postHogClient } from "../lib/clients/postHogClient";
import { supabaseServer } from "../lib/routers/withAuth";
import { getRequests } from "../lib/stores/request/request";
import { FineTuningManager } from "../managers/FineTuningManager";
import { JawnAuthenticatedRequest } from "../types/request";

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
    const { data: key, error: keyError } = await supabaseServer.client
      .from("decrypted_provider_keys")
      .select("decrypted_provider_key")
      .eq("id", providerKeyId)
      .eq("org_id", request.authParams.organizationId)
      .single();
    if (keyError || !key || !key.decrypted_provider_key) {
      this.setStatus(500);
      return {
        error: "No Provider Key found",
      };
    }
    const fineTuningManager = new FineTuningManager(key.decrypted_provider_key);
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
      const dataset = await supabaseServer.client
        .from("finetune_dataset")
        .insert({
          name: `Automated Dataset for ${fineTuneJob.data.id}`,
          filters: JSON.stringify([]),
          organization_id: request.authParams.organizationId,
        })
        .select("*")
        .single();
      if (dataset.error || !dataset.data) {
        this.setStatus(500);
        return {
          error: dataset.error.message,
        };
      }
      const fineTunedJobId = await supabaseServer.client
        .from("finetune_job")
        .insert({
          dataset_id: dataset.data.id,
          finetune_job_id: fineTuneJob.data.id,
          provider_key_id: providerKeyId,
          status: "created",
          organization_id: request.authParams.organizationId,
        })
        .select("*")
        .single();
      return {
        success: true,
        data: {
          fineTuneJob: fineTunedJobId.data?.id ?? "",
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
    const { data: fineTuneJob, error: fineTuneJobError } =
      await supabaseServer.client
        .from("finetune_job")
        .select("*")
        .eq("id", jobId ?? "")
        .eq("organization_id", request.authParams.organizationId)
        .single();
    if (!fineTuneJob || fineTuneJobError) {
      this.setStatus(404);
      return {
        error: "No fine tune job found",
      };
    }
    const { data: key, error: keyError } = await supabaseServer.client
      .from("decrypted_provider_keys")
      .select("decrypted_provider_key")
      .eq("id", fineTuneJob.provider_key_id)
      .eq("org_id", request.authParams.organizationId)
      .single();
    if (keyError || !key || !key.decrypted_provider_key) {
      this.setStatus(404);
      return {
        error: "No key found",
      };
    }
    const fineTuningManager = new FineTuningManager(key.decrypted_provider_key);
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
