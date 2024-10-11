import { uuid } from "uuidv4";
import { Result, err, ok } from "../shared/result";

import { supabaseServer } from "../db/supabase";
import { Experiment } from "../stores/experimentStore";
import { BaseTempKey } from "./tempKeys/baseTempKey";
import { prepareRequestOpenAIFull } from "./requestPrep/openaiCloud";
import { prepareRequestAzureFull as prepareRequestAzureOnPremFull } from "./requestPrep/azure";
import { runHypothesis } from "./hypothesisRunner";
import { generateHeliconeAPIKey } from "./tempKeys/tempAPIKey";
import { generateProxyKey } from "./tempKeys/tempProxyKey";
import {
  PreparedRequest,
  PreparedRequestArgs,
} from "./requestPrep/PreparedRequest";
import { prepareRequestOpenAIOnPremFull } from "./requestPrep/openai";
import { getAllSignedURLsFromInputs } from "../../managers/inputs/InputsManager";

export const IS_ON_PREM =
  process.env.AZURE_BASE_URL &&
  process.env.AZURE_API_VERSION &&
  process.env.AZURE_DEPLOYMENT_NAME &&
  process.env.OPENAI_API_KEY
    ? true
    : false;

async function prepareRequest(
  args: PreparedRequestArgs,
  onPremConfig: {
    deployment: "AZURE" | "OPENAI";
  }
): Promise<PreparedRequest> {
  if (args.hypothesis.providerKey === null) {
    if (IS_ON_PREM && onPremConfig.deployment === "AZURE") {
      return await prepareRequestAzureOnPremFull(args);
    } else {
      return prepareRequestOpenAIOnPremFull(args);
    }
  } else {
    return prepareRequestOpenAIFull(args);
  }
}

export async function run(
  experiment: Experiment
): Promise<Result<string, string>> {
  const tempKey: Result<BaseTempKey, string> = await generateHeliconeAPIKey(
    experiment.organization
  );

  if (tempKey.error || !tempKey.data) {
    return err(tempKey.error);
  }

  return tempKey.data.with<Result<string, string>>(async (secretKey) => {
    for (const hypothesis of experiment.hypotheses) {
      for (const data of experiment.dataset.rows) {
        const requestId = uuid();

        if (data.inputRecord?.inputs) {
          data.inputRecord.inputs = await getAllSignedURLsFromInputs(
            data.inputRecord.inputs,
            experiment.organization,
            data.inputRecord.requestId,
            true
          );
        }

        const preparedRequest = await prepareRequest(
          {
            hypothesis,
            secretKey,
            datasetRow: data,
            requestId,
          },
          {
            deployment: experiment.meta?.deployment ?? "AZURE",
          }
        );

        await runHypothesis({
          body: preparedRequest.body,
          headers: preparedRequest.headers,
          url: preparedRequest.url,
          requestId,
          datasetRowId: data.rowId,
          hypothesisId: hypothesis.id,
        });
      }
      const newExperiment = await supabaseServer.client
        .from("experiment_v2_hypothesis")
        .update({
          status: "COMPLETED",
        })
        .eq("id", hypothesis.id);

      if (newExperiment.error) {
        return err(newExperiment.error.message);
      }
    }
    return ok("success");
  });
}
