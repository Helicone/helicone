import { uuid } from "uuidv4";
import { Result, err, ok } from "../shared/result";
import { generateHeliconeAPIKey, generateProxyKey } from "./tempProxyKey";
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

function prepareRequestAzure(
  requestPath: string,
  apiKey: string,
  requestId: string
): {
  url: URL;
  headers: { [key: string]: string };
} {
  let headers: { [key: string]: string } = {
    "Content-Type": "application/json",
    "Helicone-Request-Id": requestId,
    "Helicone-Auth": `Bearer ${apiKey}`,
  };
  let fetchUrl = "";
  const azureAPIKey = process.env.AZURE_API_KEY ?? "";
  const apiVersion = process.env.AZURE_API_VERSION;
  const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME;
  const azureBaseUrl = process.env.AZURE_BASE_URL ?? "";
  const heliconeWorkerUrl = process.env.HELICONE_WORKER_URL ?? "";
  if (requestPath.includes("/chat/completions")) {
    fetchUrl = `${heliconeWorkerUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${apiVersion}`;
  } else {
    //otherwise let's try to extract what would've been the path
    const url = new URL(requestPath);

    const path = url.pathname;

    const lastTwo = path.split("/").slice(-2);

    fetchUrl = `${heliconeWorkerUrl}/openai/deployments/${azureDeploymentName}/${lastTwo.join(
      "/"
    )}?api-version=${apiVersion}`;
  }

  headers["Helicone-OpenAI-API-Base"] = azureBaseUrl;
  headers["api-key"] = azureAPIKey;

  return {
    url: new URL(fetchUrl),
    headers,
  };
}

function prepareRequestOpenAI(
  requestPath: string,
  proxyKey: string,
  requestId: string
): {
  url: URL;
  headers: { [key: string]: string };
} {
  let headers: { [key: string]: string } = {
    "Content-Type": "application/json",
    "Helicone-Request-Id": requestId,
    Authorization: `Bearer ${proxyKey}`,
  };
  let fetchUrl = requestPath;
  return {
    url: new URL(fetchUrl),
    headers,
  };
}

function prepareRequestOpenAIFull(
  hypothesis: Experiment["hypotheses"][number],
  proxyKey: string,
  datasetRow: Experiment["dataset"]["rows"][number],
  requestId: string
): {
  url: URL;
  headers: { [key: string]: string };
  body: any;
} {
  const newRequestBody = placeInputValues(
    datasetRow.inputRecord?.inputs ?? {},
    hypothesis.promptVersion?.template ?? {}
  );

  const { url: fetchUrl, headers } = prepareRequestOpenAI(
    datasetRow.inputRecord!.requestPath,
    proxyKey,
    requestId
  );
  return {
    url: fetchUrl,
    headers,
    body: newRequestBody,
  };
}

function prepareRequestAzureFull(
  hypothesis: Experiment["hypotheses"][number],
  apiKey: string,
  datasetRow: Experiment["dataset"]["rows"][number],
  requestId: string
): {
  url: URL;
  headers: { [key: string]: string };
  body: any;
} {
  const newRequestBody = placeInputValues(
    datasetRow.inputRecord?.inputs ?? {},
    hypothesis.promptVersion?.template ?? {}
  );

  const { url: fetchUrl, headers } = prepareRequestAzure(
    datasetRow.inputRecord!.requestPath,
    apiKey,
    requestId
  );
  return {
    url: fetchUrl,
    headers,
    body: newRequestBody,
  };
}

async function runHypothesis(props: {
  url: URL;
  headers: { [key: string]: string };
  body: any;
  requestId: string;
  datasetRowId: string;
  hypothesisId: string;
}): Promise<Result<string, string>> {
  const { url, headers, body, requestId, datasetRowId, hypothesisId } = props;

  const response = await fetch(url, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(body),
  });

  if (response.status !== 200) {
    console.error(
      "error running hypothesis",
      hypothesisId,
      datasetRowId,
      requestId,
      response.status
    );
  }
  // wait 10 seconds for the request to be processed
  let retries = 3;
  while (retries > 0) {
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    const putResultInDataset = await supabaseServer.client
      .from("experiment_v2_hypothesis_run")
      .insert({
        dataset_row: datasetRowId,
        result_request_id: requestId,
        experiment_hypothesis: hypothesisId,
      });
    if (putResultInDataset.error) {
      retries--;
      console.error(putResultInDataset.error);
    } else {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }

  return ok("success");
}

export async function run(
  experiment: Experiment
): Promise<Result<string, string>> {
  if (process.env.AZURE_BASE_URL) {
    console.log("running experiment on azure");
    return runAzure(experiment);
  } else {
    return runOpenAI(experiment);
  }
}

async function runOpenAI(
  experiment: Experiment
): Promise<Result<string, string>> {
  for (const hypothesis of experiment.hypotheses) {
    const proxyKey = await generateProxyKey(
      hypothesis.providerKey,
      "helicone-experiment" + uuid()
    );
    await proxyKey.data?.with(async (proxyKey) => {
      for (const data of experiment.dataset.rows) {
        const requestId = uuid();
        const preparedRequest = prepareRequestOpenAIFull(
          hypothesis,
          proxyKey,
          data,
          requestId
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

async function runAzure(
  experiment: Experiment
): Promise<Result<string, string>> {
  for (const hypothesis of experiment.hypotheses) {
    const tempApiKey = await generateHeliconeAPIKey(experiment.organization);
    await tempApiKey.data?.with(async (apiKey) => {
      for (const data of experiment.dataset.rows) {
        const requestId = uuid();
        const preparedRequest = prepareRequestAzureFull(
          hypothesis,
          apiKey,
          data,
          requestId
        );

        console.log("running hypothesis", hypothesis.id);
        await runHypothesis({
          body: preparedRequest.body,
          headers: preparedRequest.headers,
          url: preparedRequest.url,
          requestId,
          datasetRowId: data.rowId,
          hypothesisId: hypothesis.id,
        });
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
