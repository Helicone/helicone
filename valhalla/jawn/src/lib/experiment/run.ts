import { uuid } from "uuidv4";
import { Result, err } from "../modules/result";
import { ExperimentType } from "./dbCalls";
import { generateProxyKey } from "./tempProxyKey";
import { supabaseServer } from "../db/supabase";

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

export async function run(
  experiment: ExperimentType
): Promise<Result<string, string>> {
  const proxyKey = await generateProxyKey(
    experiment.provider_key,
    "helicone-experiment" + uuid()
  );
  if (proxyKey.error) {
    return err(proxyKey.error);
  }
  await proxyKey.data?.with(async (proxyKey) => {
    const datasetData = experiment.dataset.data;

    const testResults: string[] = [];
    for (const data of datasetData) {
      const requestId = uuid();
      testResults.push(requestId);

      const newRequestBody = placeInputValues(
        data.inputs,
        experiment.test_prompt.heliconeTemplate
      );

      const fetchUrl = process.env.EXPERIMENTS_HCONE_URL_OVERRIDE
        ? new URL(process.env.EXPERIMENTS_HCONE_URL_OVERRIDE)
        : new URL(data.urlPath);

      let headers: { [key: string]: string } = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${proxyKey}`,
        "Helicone-Request-Id": requestId,
      };

      // Determine if the call is for Azure and append additional headers if true
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
        .from("experiment_dataset_values")
        .update({
          result_request_id: requestId,
        })
        .eq("id", data.datasetValueId);
      if (putResultInDataset.error) {
        console.error(putResultInDataset.error);
      }
    }

    const newExperiment = await supabaseServer.client
      .from("experiments")
      .update({
        status: "completed",
      })
      .eq("id", experiment.id);
  });
  return err("Not implemented");
}
