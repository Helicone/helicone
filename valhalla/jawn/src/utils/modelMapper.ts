export function getModelFromRequest(requestBody: any, path: string) {
  if (requestBody && requestBody.model) {
    return requestBody.model;
  }

  const modelFromPath = getModelFromPath(path);
  if (modelFromPath) {
    return modelFromPath;
  }

  return null;
}

function getModelFromPath(path: string) {
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
  if (responseBody && responseBody.model) {
    return responseBody.model;
  }

  return null;
}
