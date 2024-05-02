import { Experiment } from "../../stores/experimentStore";
import { placeInputValues } from "../helpers";
import { PreparedRequest, PreparedRequestArgs } from "./PreparedRequest";

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

  const azureAPIKey = process.env.AZURE_API_KEY ?? "";
  const apiVersion = process.env.AZURE_API_VERSION;
  const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME;
  const azureBaseUrl = process.env.AZURE_BASE_URL ?? "";
  const heliconeWorkerUrl = process.env.HELICONE_WORKER_URL ?? "";

  const fetchUrl = `${heliconeWorkerUrl}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${apiVersion}`;

  headers["Helicone-OpenAI-API-Base"] = azureBaseUrl;
  headers["api-key"] = azureAPIKey;

  return {
    url: new URL(fetchUrl),
    headers,
  };
}

export function prepareRequestAzureFull({
  hypothesis,
  secretKey: apiKey,
  datasetRow,
  requestId,
}: PreparedRequestArgs): PreparedRequest {
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
