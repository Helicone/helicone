export function placeAssetIdValues(
  inputValues: Record<string, string>,
  heliconeTemplate: any
): any {
  function traverseAndTransform(obj: any): any {
    if (typeof obj === "string") {
      // Adjusted regex for <helicone-asset-id> pattern
      const regex = /<helicone-asset-id key="([^"]+)"\s*\/>/g;
      return obj.replace(regex, (match, key) => {
        // Use the key extracted from <helicone-asset-id> to fetch the replacement value
        return inputValues[key] ?? match; // Replace with value from inputValues or keep the match if not found
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
    return obj; // Return the object if it doesn't match any of the above conditions
  }
  return traverseAndTransform(heliconeTemplate);
}
