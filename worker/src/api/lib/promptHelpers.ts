/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Parses a string containing custom JSX-like tags and extracts information to produce two outputs:
 * 1. A version of the string with all JSX tags removed, leaving only the text content.
 * 2. An object representing a template with self-closing JSX tags and a separate mapping of keys to their
 *    corresponding text content.
 *
 * The function specifically targets `<helicone-prompt-input>` tags, which include a `key` attribute and enclosed text content.
 * These tags are transformed or removed based on the desired output structure. The process involves regular expressions
 * to match and manipulate the input string to produce the outputs.
 *
 * Parameters:
 * - input: A string containing the text and JSX-like tags to be parsed.
 *
 * Returns:
 * An object with two properties:
 * 1. stringWithoutJSXTags: A string where all `<helicone-prompt-input>` tags are removed, and only their text content remains.
 * 2. templateWithInputs: An object containing:
 *    - template: A version of the input string where `<helicone-prompt-input>` tags are replaced with self-closing versions,
 *      preserving the `key` attributes but removing the text content.
 *    - inputs: An object mapping the `key` attributes to their corresponding text content, effectively extracting
 *      the data from the original tags.
 *
 * Example Usage:
 * ```ts
 * const input = `
 * The scene is <helicone-prompt-input key="scene" >Harry Potter</helicone-prompt-input>.
 * <helicone-prompt-input key="name" >justin</helicone-prompt-input>  test`;
 *
 * const expectedOutput = parseJSXString(input);
 * console.log(expectedOutput);
 *```
 * The function is useful for preprocessing strings with embedded custom JSX-like tags, extracting useful data,
 * and preparing templates for further processing or rendering. It demonstrates a practical application of regular
 * expressions for text manipulation in TypeScript, specifically tailored to a custom JSX-like syntax.
 */

export interface TemplateWithInputs {
  template: object;
  inputs: { [key: string]: string };
}

export function parseJSXObject(input: object): {
  objectWithoutJSXTags: object;
  templateWithInputs: TemplateWithInputs;
} {
  const inputs: { [key: string]: string } = {};

  function traverseAndTransform(obj: any): any {
    if (typeof obj === "string") {
      // Remove JSX tags and keep content
      const stringWithoutJSXTags = obj.replace(
        /<helicone-prompt-input key="[^"]*" *>([\s\S]*?)<\/helicone-prompt-input>/g,
        "$1"
      );

      // Replace JSX tags with self-closing tags and extract inputs
      const templateWithSelfClosingTags = obj.replace(
        /<helicone-prompt-input key="([^"]*)" *>([\s\S]*?)<\/helicone-prompt-input>/g,
        (_, key, value) => {
          inputs[key] = value.trim();
          return `<helicone-prompt-input key="${key}" />`;
        }
      );

      return { stringWithoutJSXTags, templateWithSelfClosingTags };
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
  const transformed = traverseAndTransform(input);

  // Construct the final output structure
  const objectWithoutJSXTags = JSON.parse(
    JSON.stringify(transformed, (key, value) =>
      typeof value === "object" &&
      value !== null &&
      "stringWithoutJSXTags" in value
        ? value.stringWithoutJSXTags
        : value
    )
  );

  const templateWithInputs = JSON.parse(
    JSON.stringify(transformed, (key, value) =>
      typeof value === "object" &&
      value !== null &&
      "templateWithSelfClosingTags" in value
        ? value.templateWithSelfClosingTags
        : value
    )
  );

  return {
    objectWithoutJSXTags,
    templateWithInputs: {
      template: templateWithInputs,
      inputs,
    },
  };
}
