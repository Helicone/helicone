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
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Helicone-Auth": `Bearer ${apiKey}`,
    Accept: "application/json",
  };

  const heliconeWorkerUrl = process.env.HELICONE_WORKER_URL ?? "";
  let fetchUrl = `${heliconeWorkerUrl}/v1/chat/completions`;

  return {
    url: new URL(fetchUrl),
    headers,
  };
}

export function prepareRequestOpenAIOnPremFull({
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
