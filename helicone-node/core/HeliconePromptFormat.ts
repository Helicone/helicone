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
  chain?: (strings: TemplateStringsArray, ...values: unknown[]) => string;
  format: "raw" | "template";
}

const hpromptTag = "helicone-prompt-input";

/**
 * Generates a prompt with annotated variables.
 * @param chain - Any other chian you want to use for template literal function for postprocessing, though any similar function may be provided. (ex. dedent, sql)
 * @param format - The format of the prompt. If 'raw', the prompt will be returned as a string with the variables replaced. If 'template', the prompt will be returned as a string with the variables replaced with helicone-prompt-input tags.
 */

type StringFormatter = (
  strings: TemplateStringsArray,
  ...values: any[]
) => string;

export const hpromptc =
  ({ format, chain }: HPromptConfig) =>
  (strings: TemplateStringsArray, ...values: any[]): string => {
    const newValues = values.map((v) => {
      if (typeof v === "object") {
        if (format === "raw") {
          return Object.values(v)[0];
        } else {
          return `<${hpromptTag} key="${Object.keys(v)[0]}" >${
            Object.values(v)[0] as string
          }</${hpromptTag}>`;
        }
      } else {
        return v;
      }
    });
    if (chain) {
      return chain(strings, ...newValues);
    } else {
      return strings.reduce((acc, string, i) => {
        return acc + string + (newValues[i] || "");
      }, "");
    }
  };

export const hprompt = hpromptc({ format: "template" });
export const hpromptr = (chain: StringFormatter) =>
  hpromptc({ format: "template", chain });