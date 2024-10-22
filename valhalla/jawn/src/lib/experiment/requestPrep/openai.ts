import { autoFillInputs } from "@helicone/prompts";
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
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Helicone-Auth": `Bearer ${apiKey}`,
    Accept: "application/json",
    "Accept-Encoding": "",
  };

  const heliconeWorkerUrl = process.env.HELICONE_WORKER_URL ?? "";
  let fetchUrl = `${heliconeWorkerUrl}/v1/chat/completions`;

  console.log("fetchUrl", fetchUrl);

  return {
    url: new URL(fetchUrl),
    headers,
  };
}

function prepareRequestAnthropic(
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
    Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`,
    "Helicone-Auth": `Bearer ${apiKey}`,
    Accept: "application/json",
    "Accept-Encoding": "",
  };

  return {
    url: new URL(requestPath),
    headers,
  };
}

export function prepareRequestOpenAIOnPremFull({
  template,
  secretKey: apiKey,
  datasetRow,
  requestId,
}: PreparedRequestArgs): PreparedRequest {
  const newRequestBody = autoFillInputs({
    template: template ?? {},
    inputs: datasetRow.inputRecord?.inputs ?? {},
    autoInputs: datasetRow.inputRecord?.autoInputs ?? [],
  });

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

export function prepareRequestAnthropicFull({
  template,
  secretKey: proxyKey,
  datasetRow,
  requestId,
}: PreparedRequestArgs): PreparedRequest {
  const newRequestBody = autoFillInputs({
    template: template ?? {},
    inputs: datasetRow.inputRecord?.inputs ?? {},
    autoInputs: datasetRow.inputRecord?.autoInputs ?? [],
  });

  const { url: fetchUrl, headers } = prepareRequestAnthropic(
    datasetRow.inputRecord?.requestPath ??
      `${process.env.HELICONE_LLMMAPPER_URL}/oai2ant/v1`,
    proxyKey,
    requestId
  );
  return {
    url: fetchUrl,
    headers,
    body: newRequestBody,
  };
}
