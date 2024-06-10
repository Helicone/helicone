export function placeInputValues(
  inputValues: Record<string, string>,
  heliconeTemplate: any
): any {
  const remainingInputValues = { ...inputValues };

  function traverseAndTransform(obj: any, path: string[] = []): any {
    if (typeof obj === "string") {
      const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
      return obj.replace(regex, (match, key) => {
        if (remainingInputValues[key] !== undefined) {
          const value = remainingInputValues[key];
          delete remainingInputValues[key];
          return value;
        }
        return "";
      });
    } else if (Array.isArray(obj)) {
      return obj
        .map((item, index) =>
          traverseAndTransform(item, path.concat(index.toString()))
        )
        .filter((item) => {
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
        const transformedValue = traverseAndTransform(
          obj[key],
          path.concat(key)
        );
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

      // Add any remaining input values as new image_url objects
      if (path.length === 0 && Object.keys(remainingInputValues).length > 0) {
        const newContent = Object.keys(remainingInputValues).map((key) => ({
          type: "image_url",
          image_url: {
            url: remainingInputValues[key],
          },
        }));

        if (result.messages) {
          result.messages.forEach((message: any) => {
            if (Array.isArray(message.content)) {
              message.content = message.content.concat(newContent);
            }
          });
        }
      }

      return result;
    }
    return obj;
  }

  const result = traverseAndTransform(heliconeTemplate);

  return result;
}
