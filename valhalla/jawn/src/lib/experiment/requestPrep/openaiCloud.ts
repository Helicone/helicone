import { autoFillInputs } from "@helicone/prompts";
import { PreparedRequest, PreparedRequestArgs } from "./PreparedRequest";

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
  };
  let fetchUrl = requestPath;
  return {
    url: new URL(fetchUrl),
    headers,
  };
}

export function prepareRequestOpenAIFull({
  hypothesis,
  secretKey: proxyKey,
  datasetRow,
  requestId,
}: PreparedRequestArgs): PreparedRequest {
  const newRequestBody = autoFillInputs({
    template: hypothesis.promptVersion?.template ?? {},
    inputs: datasetRow.inputRecord?.inputs ?? {},
    autoInputs: datasetRow.inputRecord?.autoInputs ?? [],
  });

  const { url: fetchUrl, headers } = prepareRequestOpenAI(
    datasetRow.inputRecord?.requestPath ??
      "http://localhost:8787/v1/chat/completions",
    proxyKey,
    requestId
  );
  return {
    url: fetchUrl,
    headers,
    body: newRequestBody,
  };
}
