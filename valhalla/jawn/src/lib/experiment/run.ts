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

function prepareRequest(
  requestPath: string,
  proxyKey: string,
  requestId: string
): {
  url: URL;
  headers: { [key: string]: string };
} {
  let headers: { [key: string]: string } = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${proxyKey}`,
    "Helicone-Request-Id": requestId,
  };
  let fetchUrl = requestPath;
  if (process.env.AZURE_API_KEY) {
    const azureAPIKey = process.env.AZURE_API_KEY ?? "";
    const apiVersion = process.env.AZURE_API_VERSION;
    const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME;
    const azureBaseUrl = process.env.AZURE_BASE_URL ?? "";
    if (requestPath.includes("/chat/completions")) {
      fetchUrl = `https://oai.hconeai.com/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${apiVersion}`;
    } else {
      //otherwise let's try to extract what would've been the path
      const url = new URL(requestPath);

      const path = url.pathname;

      const lastTwo = path.split("/").slice(-2);

      fetchUrl = `https://oai.hconeai.com/openai/deployments/${azureDeploymentName}/${lastTwo.join(
        "/"
      )}?api-version=${apiVersion}`;
    }

    headers["Helicone-OpenAI-API-Base"] = azureBaseUrl;
    headers["api-key"] = azureAPIKey;
  }

  return {
    url: new URL(fetchUrl),
    headers,
  };
}

async function runHypothesis(
  hypothesis: Experiment["hypotheses"][number],
  proxyKey: string,
  datasetRow: Experiment["dataset"]["rows"][number]
): Promise<Result<string, string>> {
  const requestId = uuid();
  console.log("datasetRow.inputsRecord?.inputs", datasetRow.inputRecord);
  const newRequestBody = placeInputValues(
    datasetRow.inputRecord?.inputs ?? {},
    hypothesis.promptVersion?.template ?? {}
  );

  const { url: fetchUrl, headers } = prepareRequest(
    datasetRow.inputRecord!.requestPath,
    proxyKey,
    requestId
  );

  const response = await fetch(fetchUrl, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(newRequestBody),
  });

  // wait 10 seconds for the request to be processed
  await new Promise((resolve) => setTimeout(resolve, 10_000));
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
    console.log("running hypothesis", hypothesis.id);
    const proxyKey = await generateProxyKey(
      hypothesis.providerKey,
      "helicone-experiment" + uuid()
    );
    await proxyKey.data?.with(async (proxyKey) => {
      console.log(
        "running hypothesis",
        hypothesis.id,
        "with proxy key",
        proxyKey
      );
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
