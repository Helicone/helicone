export const isImageModel = (modelName: string): boolean => {
  const models = new Set<string>([
    "gpt-4-vision-preview",
    "gpt-4-1106-vision-preview",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
  ]);
  return models.has(modelName);
};
