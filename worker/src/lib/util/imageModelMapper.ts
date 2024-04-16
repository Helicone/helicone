const requestModels = new Set<string>([
  "gpt-4-turbo",
  "gpt-4-turbo-2024-04-09",
  "gpt-4-vision-preview",
  "gpt-4-1106-vision-preview",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229",
  "claude-3-haiku-20240307",
]);

const responseModels = new Set<string>(["dall-e-3", "dall-e-2"]);

export const isRequestImageModel = (modelName: string): boolean => {
  return requestModels.has(modelName);
};

export const isResponseImageModel = (modelName: string): boolean => {
  return responseModels.has(modelName);
};

export const isImageModel = (modelName: string): boolean => {
  return isRequestImageModel(modelName) || isResponseImageModel(modelName);
};
