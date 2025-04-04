import { uuid } from "uuidv4";
import { Result, err, ok } from "../../packages/common/result";

import { Experiment, ExperimentDatasetRow } from "../stores/experimentStore";
import { BaseTempKey } from "./tempKeys/baseTempKey";
import { runHypothesis } from "./hypothesisRunner";
import { generateTempHeliconeAPIKey } from "./tempKeys/tempAPIKey";
import {
  PreparedRequest,
  PreparedRequestArgs,
} from "./requestPrep/PreparedRequest";
import { getAllSignedURLsFromInputs } from "../../managers/inputs/InputsManager";
import { prepareRequestOpenRouterFull } from "./requestPrep/openRouter";
import { prepareRequestAzureFull as prepareRequestAzureOnPremFull } from "./requestPrep/azure";
import { OPENROUTER_KEY, OPENROUTER_WORKER_URL } from "../clients/constant";
import { SettingsManager } from "../../utils/settings";
import { prepareRequestOpenAIOnPremFull } from "./requestPrep/openai";
import { dbExecute } from "../shared/db/dbExecute";

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

type Provider = "OPENAI" | "OPENROUTER";

async function prepareRequest(
  args: PreparedRequestArgs,
  provider: Provider
): Promise<PreparedRequest> {
  if (await isOnPrem()) {
    return await prepareRequestAzureOnPremFull(args);
  } else if (provider === "OPENAI") {
    return prepareRequestOpenAIOnPremFull(args);
  } else {
    return prepareRequestOpenRouterFull(args);
  }
}

interface PromptVersion {
  id: string;
  helicone_template: any;
  model: string | null;
  [key: string]: any;
}

interface PromptInputRecord {
  id: string;
  inputs: Record<string, string> | null;
  auto_prompt_inputs: Record<string, any>[] | null;
  [key: string]: any;
}

export async function runOriginalExperiment(
  experiment: Experiment,
  datasetRows: ExperimentDatasetRow[]
): Promise<Result<string, string>> {
  const tempKey: Result<BaseTempKey, string> = await generateTempHeliconeAPIKey(
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

      const promptVersionResult = await dbExecute<PromptVersion>(
        `SELECT * 
         FROM prompts_versions 
         WHERE id = $1 
         LIMIT 1`,
        [promptVersionId]
      );

      if (
        promptVersionResult.error ||
        !promptVersionResult.data ||
        promptVersionResult.data.length === 0
      ) {
        return err(promptVersionResult.error || "Prompt version not found");
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
  const tempKey: Result<BaseTempKey, string> = await generateTempHeliconeAPIKey(
    organizationId
  );

  if (tempKey.error || !tempKey.data) {
    return err(tempKey.error);
  }

  const promptVersionResult = await dbExecute<PromptVersion>(
    `SELECT * 
     FROM prompts_versions 
     WHERE id = $1 
     LIMIT 1`,
    [promptVersionId]
  );

  if (
    promptVersionResult.error ||
    !promptVersionResult.data ||
    promptVersionResult.data.length === 0
  ) {
    return err(promptVersionResult.error || "Prompt version not found");
  }
  const promptVersion = promptVersionResult.data[0];

  const promptInputRecordResult = await dbExecute<PromptInputRecord>(
    `SELECT * 
     FROM prompt_input_record 
     WHERE id = $1 
     LIMIT 1`,
    [inputRecordId]
  );

  if (
    promptInputRecordResult.error ||
    !promptInputRecordResult.data ||
    promptInputRecordResult.data.length === 0
  ) {
    return err(
      promptInputRecordResult.error || "Prompt input record not found"
    );
  }
  const promptInputRecord = promptInputRecordResult.data[0];

  return tempKey.data.with<Result<string, string>>(async (secretKey) => {
    const requestId = uuid();

    let inputs: Record<string, string> = {};
    if (promptInputRecord.inputs) {
      inputs = await getAllSignedURLsFromInputs(
        promptInputRecord.inputs,
        organizationId,
        requestId,
        true
      );
    }

    const preparedRequest = await prepareRequest(
      {
        template: promptVersion.helicone_template,
        providerKey: OPENROUTER_KEY,
        secretKey,
        inputs: inputs,
        autoInputs:
          (promptInputRecord.auto_prompt_inputs as Record<string, any>[]) || [],
        requestPath: `${OPENROUTER_WORKER_URL}/api/v1/chat/completions`,
        requestId,
        experimentId,
        model: promptVersion.model ?? "",
      },
      providerByModelName(promptVersion.model ?? "")
    );

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
  if (modelName.includes("gpt")) {
    return "OPENAI";
  } else {
    return "OPENROUTER";
  }
};
