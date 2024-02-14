export function prompt(
  strings: TemplateStringsArray,
  ...values: any[]
): {
  heliconeTemplate: string;
  inputs: Record<string, any>;
  builtString: string;
} {
  const heliconeTemplate = strings.reduce((acc, string, i) => {
    const val = values[i];
    if (val != null) {
      const key = Object.keys(val)[0];
      return acc + string + `<helicone-prompt-input key="${key}" />`;
    } else {
      return acc + string;
    }
  }, "");

  const inputs = strings.reduce((acc, string, i) => {
    const val = values[i];
    if (val != null) {
      const value = Object.values(val)[0];
      return { ...acc, [Object.keys(val)[0]]: value };
    } else {
      return acc;
    }
  }, {});

  const builtString = strings.reduce((acc, string, i) => {
    const val = values[i];
    if (val != null) {
      const value = Object.values(val)[0];
      return acc + string + value;
    } else {
      return acc + string;
    }
  }, "");
  return { heliconeTemplate, inputs, builtString };
}

interface HPromptConfig {
  dedent?: (strings: TemplateStringsArray, ...values: unknown[]) => string;
  format: "raw" | "template";
}

const hpromptTag = "helicone-prompt-input";

/**
 * Generates a prompt with annotated variables.
 * @param dedent - Dedent is the name of the most commonly used tagged template literal function for postprocessing, though any similar function may be provided.
 * @param format - The format of the prompt. If 'raw', the prompt will be returned as a string with the variables replaced. If 'template', the prompt will be returned as a string with the variables replaced with helicone-prompt-input tags.
 */
export const hprompt =
  (config?: HPromptConfig) =>
  (strings: TemplateStringsArray, ...values: any[]): string => {
    const { dedent, format = "template" } = config ?? {};
    const parts: string[] = strings.reduce(
      (acc: string[], str: string, i: number) => {
        acc.push(str);
        if (values[i] != null) {
          const isObject = typeof values[i] === "object";
          const value = isObject ? Object.values(values[i])[0] : values[i];
          acc.push(
            format === "template" && isObject
              ? `<${hpromptTag} key="${
                  Object.keys(values[i])[0]
                }">${value}</${hpromptTag}>`
              : value
          );
        }
        return acc;
      },
      []
    );
    const output = parts.join("");
    return dedent != null ? dedent`${output}` : output;
  };
