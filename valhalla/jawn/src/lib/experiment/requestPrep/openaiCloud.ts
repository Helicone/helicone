import { autoFillInputs } from "@helicone/prompts";
import { PreparedRequest, PreparedRequestArgs } from "./PreparedRequest";
import { ENVIRONMENT } from "../../..";

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
    Accept: "application/json",
    "Accept-Encoding": "",
    "Helicone-Experiment-Secret-Key": process.env.EXPERIMENTS_SECRET_KEY ?? "",
  };
  let fetchUrl = requestPath;
  return {
    url: new URL(fetchUrl),
    headers,
  };
}

export function prepareRequestOpenAIFull({
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

  const { url: fetchUrl, headers } = prepareRequestOpenAI(
    datasetRow.inputRecord?.requestPath ??
      `${process.env.HELICONE_WORKER_URL}/v1/chat/completions`,
    proxyKey,
    requestId
  );
  return {
    url: fetchUrl,
    headers,
    body: newRequestBody,
  };
}
