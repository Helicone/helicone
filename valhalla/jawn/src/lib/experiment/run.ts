import { uuid } from "uuidv4";
import { Result, err, ok } from "../shared/result";
import { generateProxyKey } from "./tempProxyKey";
import { supabaseServer } from "../db/supabase";
import { Experiment } from "../stores/experimentStore";

function placeInputValues(
  inputValues: Record<string, string>,
  heliconeTemplate: any
): any {
  function traverseAndTransform(obj: any): any {
    if (typeof obj === "string") {
      const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
      return obj.replace(regex, (match, key) => {
        return inputValues[key] ?? match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(traverseAndTransform);
    } else if (typeof obj === "object" && obj !== null) {
      const result: { [key: string]: any } = {};
      for (const key of Object.keys(obj)) {
        result[key] = traverseAndTransform(obj[key]);
      }
      return result;
    }
    return obj;
  }
  return traverseAndTransform(heliconeTemplate);
}

async function runHypothesis(
  hypothesis: Experiment["hypotheses"][number],
  proxyKey: string,
  datasetRow: Experiment["dataset"]["rows"][number]
): Promise<Result<string, string>> {
  const requestId = uuid();
  const newRequestBody = placeInputValues(
    datasetRow.inputsRecord!.inputs,
    hypothesis.promptVersion!.template
  );
  const fetchUrl = process.env.EXPERIMENTS_HCONE_URL_OVERRIDE
    ? new URL(process.env.EXPERIMENTS_HCONE_URL_OVERRIDE)
    : new URL(datasetRow.inputsRecord!.requestPath);
  let headers: { [key: string]: string } = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${proxyKey}`,
    "Helicone-Request-Id": requestId,
  };
  if (process.env.AZURE_API_KEY) {
    headers["Helicone-OpenAI-API-Base"] = fetchUrl.origin;
    headers["api-key"] = process.env.AZURE_API_KEY;
  }
  const response = await fetch(fetchUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(newRequestBody),
  });
  // wait 1 seconds for the request to be processed
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const putResultInDataset = await supabaseServer.client
    .from("experiment_v2_hypothesis_run")
    .insert({
      dataset_row: datasetRow.rowId,
      result_request_id: requestId,
      experiment_hypothesis: hypothesis.id,
    });
  if (putResultInDataset.error) {
    console.error(putResultInDataset.error);
  }
  return ok("success");
}

export async function run(
  experiment: Experiment
): Promise<Result<string, string>> {
  for (const hypothesis of experiment.hypotheses) {
    const proxyKey = await generateProxyKey(
      hypothesis.providerKey,
      "helicone-experiment" + uuid()
    );
    await proxyKey.data?.with(async (proxyKey) => {
      for (const data of experiment.dataset.rows) {
        await runHypothesis(hypothesis, proxyKey, data);
      }
    });
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
}
