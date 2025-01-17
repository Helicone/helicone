import { autoFillInputs } from "@helicone/prompts";
import { PreparedRequest, PreparedRequestArgs } from "./PreparedRequest";

function prepareRequestOpenAI(
  requestPath: string,
  proxyKey: string,
  requestId: string,
  experimentId?: string
): {
  url: URL;
  headers: { [key: string]: string };
} {
  let headers: { [key: string]: string } = {
    "Content-Type": "application/json",
    "Helicone-Request-Id": requestId,
    Authorization: `Bearer ${proxyKey}`,
    Accept: "application/json",
    "Accept-Encoding": "",
    "Helicone-Manual-Access-Key": process.env.HELICONE_MANUAL_ACCESS_KEY ?? "",
  };
  if (experimentId) {
    headers["Helicone-Experiment-Id"] = experimentId;
  }
  let fetchUrl = requestPath;
  return {
    url: new URL(fetchUrl),
    headers,
  };
}

export function prepareRequestOpenAIFull({
  template,
  secretKey: proxyKey,
  inputs,
  autoInputs,
  requestPath,
  requestId,
  experimentId,
}: PreparedRequestArgs): PreparedRequest {
  const newRequestBody = autoFillInputs({
    template: template ?? {},
    inputs: inputs ?? {},
    autoInputs: autoInputs ?? [],
  });

  const { url: fetchUrl, headers } = prepareRequestOpenAI(
    requestPath ?? `${process.env.HELICONE_WORKER_URL}/v1/chat/completions`,
    proxyKey,
    requestId,
    experimentId
  );
  return {
    url: fetchUrl,
    headers,
    body: newRequestBody,
  };
}
