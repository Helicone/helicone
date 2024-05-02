export function placeInputValues(
  inputValues: Record<string, string>,
  heliconeTemplate: any
): any {
  function traverseAndTransform(obj: any): any {
    if (typeof obj === "string") {
      const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
      return obj.replace(regex, (match, key) => {
        return inputValues[key] ?? match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(traverseAndTransform);
    } else if (typeof obj === "object" && obj !== null) {
      const result: { [key: string]: any } = {};
      for (const key of Object.keys(obj)) {
        result[key] = traverseAndTransform(obj[key]);
      }
      return result;
    }
    return obj;
  }
  const result = traverseAndTransform(heliconeTemplate);

  return result;
}
