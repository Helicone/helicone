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
import { supabaseServer } from "../../lib/routers/withAuth";
import { getRequests, fetchBodies } from "../../lib/stores/request/request";
import { FineTuningManager } from "../../managers/finetuning/FineTuningManager";
import { JawnAuthenticatedRequest } from "../../types/request";

// src/users/usersController.ts
import { hasAccessToFineTune } from "./datasetController";
import {
  NewFineTuningManager,
  IFineTuningJob,
  IFineTuningJobEvent,
} from "../../managers/finetuning/NewFineTuningManager";
import { Result, err, ok } from "../../lib/shared/result";
import { DatasetManager } from "../../managers/dataset/DatasetManager";

export interface FineTuneBody {
  providerKeyId: string;
  datasetId?: string;
}

async function prepareFineTuneRequest(
  request: FineTuneBody,
  authParams: JawnAuthenticatedRequest["authParams"]
): Promise<
  Result<{ fineTuneManager: NewFineTuningManager; datasetId: string }, string>
> {
  const datasetManager = new DatasetManager(authParams);
  let datasetId = request.datasetId;
  if (!request.datasetId) {
    const { data: requests, error: requestsError } = await getRequests(
      authParams.organizationId,
      "all",
      0,
      1000,
      {}
    );
    if (!requests || requests.length === 0) {
      return err("No requests found");
    }
    const newDataset = await datasetManager.addDataset({
      requestIds: requests.map((r) => r.request_id),
      datasetName: "Automated Dataset",
    });
    if (newDataset.error || !newDataset.data) {
      return err(newDataset.error || "Failed to create dataset");
    }
    datasetId = newDataset.data;
  }

  const { data: key, error: keyError } = await supabaseServer.client
    .from("decrypted_provider_keys")
    .select("decrypted_provider_key")
    .eq("id", request.providerKeyId)
    .eq("org_id", authParams.organizationId)
    .single();
  if (keyError || !key || !key.decrypted_provider_key) {
    return {
      error: "No Provider Key found",
      data: null,
    };
  }
  return ok(new FineTuningManager(request.providerKeyId));
}

export interface NewFineTuneJob {
  fineTuneJobId: string;
}

interface FineTuneJobStats {
  job: IFineTuningJob;
  events: IFineTuningJobEvent[];
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
  ): Promise<Result<NewFineTuneJob, string>> {
    const { data: fineTuningObjects, error: requestBuildingError } =
      await prepareFineTuneRequest(datasetManager, body, request.authParams);

    if (requestBuildingError || !fineTuningObjects) {
      this.setStatus(500);
      return err(requestBuildingError);
    }

    const { fineTuneManager, datasetId } = fineTuningObjects;

    try {
      const fineTuneJob = await fineTuneManager.createFineTuneJob(datasetId, {
        _type: "OpenAIFineTuneJobOptions",
        model: "gpt-3.5",
      });

      if (fineTuneJob.error || !fineTuneJob.data) {
        this.setStatus(500);
        return err("Failed to create fine tune job");
      }

      return {
        success: true,
        data: {
          fineTuneJob: fineTunedJobId.data?.id ?? "",
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
  ): Promise<Result<FineTuneJobStats, string>> {
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
