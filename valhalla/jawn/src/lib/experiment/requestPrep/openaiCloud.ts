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
      (ENVIRONMENT === "production"
        ? "https://oai.helicone.ai/v1/chat/completions"
        : "http://127.0.0.1:8787/v1/chat/completions"),
    proxyKey,
    requestId
  );
  return {
    url: fetchUrl,
    headers,
    body: newRequestBody,
  };
}
