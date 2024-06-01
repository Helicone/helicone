import {
  FineTuningJob,
  FineTuningJobEventsPage,
} from "openai/resources/fine-tuning/jobs";
import { OpenAIClient } from "../../lib/clients/OpenAIClient";
import {
  HeliconeRequest,
  fetchBodies,
  getRequests,
} from "../../lib/stores/request/request";
import { Result, err, ok } from "../../lib/shared/result";
import crypto from "crypto";
import fs from "fs";
import { chatCompletionMessage } from "../types";
import { ChatCompletionMessageParam } from "openai/resources";
import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions";
import OpenAI from "openai";
import { JawnAuthenticatedRequest } from "../../types/request";
import { DatasetManager } from "../dataset/DatasetManager";
import { BaseManager } from "../BaseManager";
import { AuthParams, supabaseServer } from "../../lib/db/supabase";

export interface OpenPipeFineTuneJobOptions {
  _type: "OpenPipeFineTuneJobOptions";
  model:
    | "OpenPipe/Hermes-2-Theta-Llama-3-8B-32k"
    | "meta-llama/Meta-Llama-3-8B-Instruct"
    | "meta-llama/Meta-Llama-3-70B-Instruct"
    | "OpenPipe/mistral-ft-optimized-1227"
    | "mistralai/Mixtral-8x7B-Instruct-v0.1";
  learningRate?: number;
  numEpochs?: number;
}

export interface OpenAIFineTuneJobOptions {
  _type: "OpenAIFineTuneJobOptions";
  model: string;
}

export type FineTuneJobOptions =
  | OpenPipeFineTuneJobOptions
  | OpenAIFineTuneJobOptions;

export interface IFineTuningJob {
  id: string;
  model: string;
  status: string;
  created_at: string;
  updated_at: string;
  baseModel: string;
  errorMessage: string;
  datasetId?: string;
}

export interface IFineTuningJobEvent {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, any>;
}

//TODO rename this back to just FineTuneManager
export abstract class NewFineTuningManager extends BaseManager {
  datasetManager: DatasetManager;

  constructor(
    authParams: JawnAuthenticatedRequest["authParams"],
    private providerKeyId: string
  ) {
    super(authParams);
    this.datasetManager = new DatasetManager(authParams);
  }

  async getFineTuneJob(id: string): Promise<
    Result<
      {
        job: IFineTuningJob;
        events: IFineTuningJobEvent[];
      },
      string
    >
  > {
    throw new Error("Not implemented");
  }

  private createFineTuneJobOpenAI(
    datasetId: string,
    options: OpenAIFineTuneJobOptions
  ): Promise<Result<IFineTuningJob, string>> {
    throw new Error("Not implemented");
  }

  private createFineTuneJobRow(datasetId: string) {
    return supabaseServer.client
      .from("finetune_job")
      .insert({
        dataset_id: datasetId,
        finetune_job_id: "",
        provider_key_id: this.providerKeyId,
        status: "created",
        organization_id: this.authParams.organizationId,
      })
      .select("*")
      .single();
  }
  async createFineTuneJob(
    datasetId: string,
    options: FineTuneJobOptions
  ): Promise<Result<IFineTuningJob, string>> {
    const fineTunedJobId = await this.createFineTuneJobRow(datasetId);

    if (fineTunedJobId.error) {
      return err(fineTunedJobId.error.message);
    }

    const { data: dataset, error: datasetError } = await getRequests(
      this.authParams.organizationId,
      {
        experiment_dataset_v2_row: {
          dataset_id: {
            equals: datasetId,
          },
        },
      },

      0,
      1000,
      {
        random: true,
      }
    );

    if (datasetError || !dataset) {
      return err("Failed to get dataset from request");
    }

    const datasetWithBodies = await fetchBodies(dataset);
    // TODO upload data to either OpenAI or OpenPipe

    throw new Error("Not implemented");
  }
}
