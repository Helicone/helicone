// src/users/usersController.ts
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
import { hashAuth } from "../lib/db/hash";
import { supabaseServer } from "../lib/routers/withAuth";
import { JawnAuthenticatedRequest } from "../types/request";
import { FineTuningManager } from "../managers/FineTuningManager";
import {
  FineTuningJob,
  FineTuningJobEventsPage,
} from "openai/resources/fine-tuning/jobs";
import { FilterNode } from "../lib/shared/filters/filterDefs";
import { getRequests } from "../lib/stores/request/request";
import * as Sentry from "@sentry/node";
import { postHogClient } from "../lib/clients/postHogClient";

export interface GenerateHashQueryParams {
  apiKey: string;
  userId: string;
  keyName: string;
}

export async function hasAccessToFineTune(orgId: string) {
  const { data: org, error: orgError } = await supabaseServer.client
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .single();
  if (orgError) {
    return false;
  }

  if (!org.tier) {
    return false;
  }
  if (org.tier === "free") {
    const jobCountQuery = await supabaseServer.client
      .from("finetune_job")
      .select("*", { count: "exact" })
      .eq("organization_id", orgId);
    console.log("jobCountQuery", jobCountQuery);
    const jobsCount = jobCountQuery.count ?? 1;
    console.log("jobsCount", jobsCount);
    if (jobsCount >= 1) {
      return false;
    } else {
      return true;
    }
  }
  return true;
}

export interface FineTuneBodyParams {
  providerKeyId: string;
}
@Route("v1/dataset")
@Tags("Request")
@Security("api_key")
export class DatasetController extends Controller {
  @Post("{datasetId}/fine-tune")
  public async datasetFineTune(
    @Path() datasetId: string,
    @Body()
    body: FineTuneBodyParams,
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

    const { providerKeyId } = body;
    const { data: dataset, error: datasetError } = await supabaseServer.client
      .from("finetune_dataset")
      .select("*")
      .eq("id", datasetId)
      .single();

    let filterNode: FilterNode;
    try {
      filterNode = JSON.parse(dataset?.filter_node ?? "");
    } catch (e) {
      this.setStatus(500);
      return {
        error: "No dataset found",
      };
    }
    if (datasetError || !dataset) {
      this.setStatus(404);
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

    const { data: key, error: keyError } = await supabaseServer.client
      .from("decrypted_provider_keys")
      .select("decrypted_provider_key")
      .eq("id", providerKeyId)
      .eq("org_id", request.authParams.organizationId)
      .single();

    if (keyError || !key || !key.decrypted_provider_key) {
      this.setStatus(404);
      return {
        error: "No Provider  key found",
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

      const fineTunedJobId = await supabaseServer.client
        .from("finetune_job")
        .insert({
          dataset_id: dataset.id,
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
}
