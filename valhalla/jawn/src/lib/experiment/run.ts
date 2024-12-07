import { uuid } from "uuidv4";
import { Result, err, ok } from "../shared/result";

import { supabaseServer } from "../db/supabase";
import { Experiment, ExperimentDatasetRow } from "../stores/experimentStore";
import { BaseTempKey } from "./tempKeys/baseTempKey";
import { runHypothesis } from "./hypothesisRunner";
import { generateHeliconeAPIKey } from "./tempKeys/tempAPIKey";
import {
  PreparedRequest,
  PreparedRequestArgs,
} from "./requestPrep/PreparedRequest";
import { getAllSignedURLsFromInputs } from "../../managers/inputs/InputsManager";
import { prepareRequestOpenRouterFull } from "./requestPrep/openRouter";
import { prepareRequestAzureFull as prepareRequestAzureOnPremFull } from "./requestPrep/azure";
import { OPENROUTER_KEY } from "../clients/constant";
import { SettingsManager } from "../../utils/settings";

export const IS_ON_PREM =
  process.env.AZURE_BASE_URL &&
  process.env.AZURE_API_VERSION &&
  process.env.AZURE_DEPLOYMENT_NAME &&
  process.env.OPENAI_API_KEY
    ? true
    : false;

async function isOnPrem(): Promise<boolean> {
  const settingsManager = new SettingsManager();
  const azureSettings = await settingsManager.getSetting("azure:experiment");
  const truthy =
    azureSettings?.azureApiKey &&
    azureSettings?.azureBaseUri &&
    azureSettings?.azureApiVersion &&
    azureSettings?.azureDeploymentName;
  return truthy ? true : false;
}

async function prepareRequest(
  args: PreparedRequestArgs
): Promise<PreparedRequest> {
  if (await isOnPrem()) {
    return await prepareRequestAzureOnPremFull(args);
  } else {
    return prepareRequestOpenRouterFull(args);
  }
}

export async function runOriginalExperiment(
  experiment: Experiment,
  datasetRows: ExperimentDatasetRow[]
): Promise<Result<string, string>> {
  const tempKey: Result<BaseTempKey, string> = await generateHeliconeAPIKey(
    experiment.organization
  );

  if (tempKey.error || !tempKey.data) {
    return err(tempKey.error);
  }

  return tempKey.data.with<Result<string, string>>(async (secretKey) => {
    for (const data of datasetRows) {
      if (data.inputRecord?.inputs) {
        data.inputRecord.inputs = await getAllSignedURLsFromInputs(
          data.inputRecord.inputs,
          experiment.organization,
          data.inputRecord.requestId,
          true
        );
      }

      const promptVersionId = experiment.meta?.["prompt_version"];

      const promptVersion = await supabaseServer.client
        .from("prompts_versions")
        .select("*")
        .eq("id", promptVersionId)
        .single();

      if (promptVersion.error || !promptVersion.data) {
        return err(promptVersion.error.message);
      }
    }
    return ok("success");
  });
}

export async function run(
  experimentId: string,
  promptVersionId: string,
  inputRecordId: string,
  organizationId: string,
  isOriginalRequest?: boolean
): Promise<Result<string, string>> {
  const tempKey: Result<BaseTempKey, string> = await generateHeliconeAPIKey(
    organizationId
  );

  if (tempKey.error || !tempKey.data) {
    return err(tempKey.error);
  }

  const promptVersion = await supabaseServer.client
    .from("prompts_versions")
    .select("*")
    .eq("id", promptVersionId)
    .single();

  if (promptVersion.error || !promptVersion.data) {
    return err(promptVersion.error.message);
  }

  const promptInputRecord = await supabaseServer.client
    .from("prompt_input_record")
    .select("*")
    .eq("id", inputRecordId)
    .single();

  if (promptInputRecord.error || !promptInputRecord.data) {
    return err(promptInputRecord.error.message);
  }

  return tempKey.data.with<Result<string, string>>(async (secretKey) => {
    const requestId = uuid();

    if (promptInputRecord.data.inputs) {
      promptInputRecord.data.inputs = await getAllSignedURLsFromInputs(
        promptInputRecord.data.inputs as Record<string, string>,
        organizationId,
        requestId,
        true
      );
    }

    const preparedRequest = await prepareRequest({
      template: promptVersion.data.helicone_template,
      providerKey: OPENROUTER_KEY,
      secretKey,
      inputs: promptInputRecord.data.inputs as Record<string, string>,
      autoInputs: promptInputRecord.data.auto_prompt_inputs as Record<
        string,
        any
      >[],
      requestPath: `${process.env.OPENROUTER_WORKER_URL}/api/v1/chat/completions`,
      requestId,
      experimentId,
      model: promptVersion.data.model ?? "",
    });

    await runHypothesis({
      body: preparedRequest.body,
      headers: preparedRequest.headers,
      url: preparedRequest.url,
      requestId,
      experimentId,
      inputRecordId,
      promptVersionId,
      isOriginalRequest,
    });

    return ok(requestId);
  });
}
const providerByModelName = (modelName: string) => {
  return modelName.includes("claude") ? "ANTHROPIC" : "OPENAI";
};
