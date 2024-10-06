export function getModelFromRequest(
  requestBody: string,
  path: string,
  targetUrl: string | null = null
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (requestBody && (requestBody as any).model) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (requestBody as any).model;
  }

  if (targetUrl && targetUrl.toLowerCase().includes("firecrawl")) {
    try {
      const parsedUrl = new URL(targetUrl);

      const path = parsedUrl.pathname;

      const trimmedPath = path.replace(/\/$/, "");

      const pathParts = trimmedPath.split("/").filter(Boolean);

      const model =
        pathParts.length > 0 ? pathParts[pathParts.length - 1] : null;
      return `firecrawl/${model}`;
    } catch (error) {
      console.error("Error parsing URL:", targetUrl);
    }
  }

  const modelFromPath = getModelFromPath(path);
  if (modelFromPath) {
    return modelFromPath;
  }

  return null;
}

function getModelFromPath(path: string) {
  console.log("path", path);
  const regex1 = /\/engines\/([^/]+)/;
  const regex2 = /models\/([^/:]+)/;

  let match = path.match(regex1);

  if (!match) {
    match = path.match(regex2);
  }

  if (match && match[1]) {
    return match[1];
  } else {
    return undefined;
  }
}

export function getModelFromResponse(responseBody: any) {
  return responseBody?.model ?? responseBody?.body?.model ?? null;
}

export function calculateModel(
  requestModel?: string,
  responseModel?: string,
  modelOverride?: string
): string | null {
  return modelOverride ?? responseModel ?? requestModel ?? null;
}

const requestModels = new Set<string>([
  "gpt-4-turbo",
  "gpt-4-turbo-2024-04-09",
  "gpt-4-vision-preview",
  "gpt-4-1106-vision-preview",
  "gpt-4o-2024-05-13",
  "gpt-4o",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
  "gpt-4o-2024-08-06",
]);

const responseModels = new Set<string>([
  "dall-e-3",
  "dall-e-2",
  "black-forest-labs/FLUX.1-schnell",
]);

export const isRequestImageModel = (modelName: string): boolean => {
  return requestModels.has(modelName);
};

export const isResponseImageModel = (modelName: string): boolean => {
  return responseModels.has(modelName);
};

export const isImageModel = (modelName: string): boolean => {
  return isRequestImageModel(modelName) || isResponseImageModel(modelName);
};
