export function placeInputValues(
  inputValues: Record<string, string>,
  heliconeTemplate: any
): any {
  function traverseAndTransform(obj: any): any {
    if (typeof obj === "string") {
      const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
      return obj.replace(regex, (match, key) => {
        return inputValues[key] !== undefined ? inputValues[key] : "";
      });
    } else if (Array.isArray(obj)) {
      return obj.map(traverseAndTransform).filter((item) => {
        if (typeof item === "string") {
          return item !== "";
        }
        if (typeof item === "object") {
          // Check if it's an image_url type and ensure it has a valid URL
          if (
            item.type === "image_url" &&
            (!item.image_url || !item.image_url.url)
          ) {
            return false;
          }
          return Object.keys(item).length > 0;
        }
        return item !== null;
      });
    } else if (typeof obj === "object" && obj !== null) {
      const result: { [key: string]: any } = {};
      for (const key of Object.keys(obj)) {
        const transformedValue = traverseAndTransform(obj[key]);
        if (transformedValue !== "" && transformedValue !== null) {
          if (typeof transformedValue === "object") {
            if (Object.keys(transformedValue).length > 0) {
              result[key] = transformedValue;
            }
          } else {
            result[key] = transformedValue;
          }
        }
      }
      return result;
    }
    return obj;
  }

  const result = traverseAndTransform(heliconeTemplate);

  return result;
}
