import { autoFillInputs } from "@helicone/prompts";
import { PreparedRequest, PreparedRequestArgs } from "./PreparedRequest";
import { OPENROUTER_MODEL_MAP } from "../openRouterModelMap";
import { OPENROUTER_WORKER_URL } from "../../clients/constant";

function prepareRequestOpenRouter(
  requestPath: string,
  heliconeApiKey: string,
  providerKey: string,
  requestId: string,
  experimentId?: string
): {
  url: URL;
  headers: { [key: string]: string };
} {
  let headers: { [key: string]: string } = {
    "Content-Type": "application/json",
    "Helicone-Request-Id": requestId,
    "Helicone-Auth": `Bearer ${heliconeApiKey}`,
    Authorization: `Bearer ${providerKey}`,
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

export function prepareRequestOpenRouterFull({
  template,
  secretKey: heliconeApiKey,
  providerKey,
  inputs,
  autoInputs,
  requestPath,
  requestId,
  experimentId,
  model,
}: PreparedRequestArgs): PreparedRequest {
  const newRequestBody = autoFillInputs({
    template: template ?? {},
    inputs: inputs ?? {},
    autoInputs: autoInputs ?? [],
  });

  const { url: fetchUrl, headers } = prepareRequestOpenRouter(
    requestPath ?? `${OPENROUTER_WORKER_URL}/api/v1/chat/completions`,
    heliconeApiKey,
    providerKey ?? "",
    requestId,
    experimentId
  );

  return {
    url: fetchUrl,
    headers,
    body: {
      ...newRequestBody,
      model: OPENROUTER_MODEL_MAP[model ?? ""],
    },
  };
}
