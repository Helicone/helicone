import { autoFillInputs } from "@helicone/prompts";
import { PreparedRequest, PreparedRequestArgs } from "./PreparedRequest";

function prepareRequestAzure(
  requestPath: string,
  apiKey: string,
  requestId: string,
  columnId?: string,
  rowIndex?: number
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

  if (columnId) {
    headers["Helicone-Experiment-Column-Id"] = columnId;
  }
  if (rowIndex !== undefined) {
    headers["Helicone-Experiment-Row-Index"] = rowIndex.toString();
  }

  const heliconeWorkerUrl = process.env.HELICONE_WORKER_URL ?? "";
  let fetchUrl = `${heliconeWorkerUrl}/v1/chat/completions`;

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

  const fetchUrl = `${process.env.HELICONE_LLMMAPPER_URL}/oai2ant/v1`;

  return {
    url: new URL(fetchUrl),
    headers,
  };
}

export function prepareRequestOpenAIOnPremFull({
  template,
  secretKey: apiKey,
  datasetRow,
  requestId,
  columnId,
  rowIndex,
}: PreparedRequestArgs): PreparedRequest {
  const newRequestBody = autoFillInputs({
    template: template ?? {},
    inputs: datasetRow.inputRecord?.inputs ?? {},
    autoInputs: datasetRow.inputRecord?.autoInputs ?? [],
  });

  const requestBodyRemoved = removeKeysWithValue(
    newRequestBody,
    "helicone-to-remove"
  );

  const { url: fetchUrl, headers } = prepareRequestAzure(
    datasetRow.inputRecord!.requestPath,
    apiKey,
    requestId,
    columnId,
    rowIndex
  );

  return {
    url: fetchUrl,
    headers,
    body: requestBodyRemoved,
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

  const requestBodyRemoved = removeKeysWithValue(
    newRequestBody,
    "helicone-to-remove"
  );

  const { url: fetchUrl, headers } = prepareRequestAnthropic(
    `${process.env.HELICONE_LLMMAPPER_URL}/oai2ant/v1`,
    proxyKey,
    requestId
  );
  return {
    url: fetchUrl,
    headers,
    body: requestBodyRemoved,
  };
}

function removeKeysWithValue(obj: any, valueToRemove: any): any {
  if (Array.isArray(obj)) {
    const newArray = obj
      .map((item) => removeKeysWithValue(item, valueToRemove))
      .filter((item) => {
        if (item === valueToRemove) return false;
        if (Array.isArray(item) && item.length === 0) return false;
        if (
          typeof item === "object" &&
          item !== null &&
          Object.keys(item).length === 0
        )
          return false;
        return true;
      });
    return newArray;
  } else if (obj && typeof obj === "object") {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const newValue = removeKeysWithValue(value, valueToRemove);
      const shouldRemove =
        newValue === valueToRemove ||
        (Array.isArray(newValue) && newValue.length === 0);
      if (!shouldRemove) {
        newObj[key] = newValue;
      }
    }
    return newObj;
  } else {
    return obj;
  }
}
