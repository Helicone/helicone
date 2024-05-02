import { Experiment } from "../../stores/experimentStore";
import { placeInputValues } from "../helpers";
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
  const newRequestBody = placeInputValues(
    datasetRow.inputRecord?.inputs ?? {},
    hypothesis.promptVersion?.template ?? {}
  );

  const { url: fetchUrl, headers } = prepareRequestOpenAI(
    datasetRow.inputRecord!.requestPath,
    proxyKey,
    requestId
  );
  return {
    url: fetchUrl,
    headers,
    body: newRequestBody,
  };
}
