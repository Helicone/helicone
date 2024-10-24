import { autoFillInputs } from "@helicone/prompts";
import { SettingsManager } from "../../../utils/settings";
import { PreparedRequest, PreparedRequestArgs } from "./PreparedRequest";

const settingsManager = new SettingsManager();
export async function prepareRequestAzure(
  apiKey?: string,
  requestId?: string
): Promise<{
  url: URL;
  headers: { [key: string]: string };
}> {
  const azureSettings = await settingsManager.getSetting("azure:experiment");
  const azureAPIKey = azureSettings?.azureApiKey ?? "";
  const apiVersion = azureSettings?.azureApiVersion ?? "";
  const azureDeploymentName = azureSettings?.azureDeploymentName ?? "";
  const azureBaseUrl = azureSettings?.azureBaseUri ?? "";
  const heliconeWorkerUrl = process.env.HELICONE_WORKER_URL ?? "";

  let headers: { [key: string]: string } = {
    "Content-Type": "application/json",
    "Helicone-OpenAI-API-Base": azureBaseUrl,
    "api-key": azureAPIKey,
    Accept: "application/json",
    "Accept-Encoding": "",
    "Helicone-Experiment-Secret-Key": process.env.EXPERIMENTS_SECRET_KEY ?? "",
  };

  if (apiKey) {
    headers = {
      ...headers,
      "Helicone-Auth": `Bearer ${apiKey}`,
    };
  }
  if (requestId) {
    headers = {
      ...headers,
      "Helicone-Request-Id": requestId,
    };
  }

  const fetchUrl = `${heliconeWorkerUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${apiVersion}`;

  return {
    url: new URL(fetchUrl),
    headers,
  };
}

export async function prepareRequestAzureFull({
  template,
  secretKey: apiKey,
  datasetRow,
  requestId,
}: PreparedRequestArgs): Promise<PreparedRequest> {
  const newRequestBody = autoFillInputs({
    template: template ?? {},
    inputs: datasetRow.inputRecord?.inputs ?? {},
    autoInputs: datasetRow.inputRecord?.autoInputs ?? [],
  });

  const { url: fetchUrl, headers } = await prepareRequestAzure(
    apiKey,
    requestId
  );
  return {
    url: fetchUrl,
    headers,
    body: newRequestBody,
  };
}
