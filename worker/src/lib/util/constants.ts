export const INTERNAL_ERRORS = {
  Cancelled: -3,
};

export const isImageModel = (modelName: string): boolean => {
  const models = new Set<string>([
    "gpt-4-vision-preview",
    "gpt-4-1106-vision-preview",
  ]);
  return models.has(modelName);
};
