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

type StringFormatter = (
  strings: TemplateStringsArray,
  ...values: any[]
) => string;

export const hpromptc =
  (type: "raw" | "template", otherFormatter?: StringFormatter) =>
  (strings: TemplateStringsArray, ...values: any[]): string => {
    const newValues =
      type === "raw"
        ? values
        : values.map((v) => {
            if (typeof v === "object") {
              return `<helicone-prompt-input key="${Object.keys(v)[0]}" >${
                Object.values(v)[0] as string
              }</helicone-prompt-input>`;
            } else {
              return v;
            }
          });
    if (otherFormatter) {
      return otherFormatter(strings, ...newValues);
    } else {
      return strings.reduce((acc, string, i) => {
        return acc + string + (newValues[i] || "");
      }, "");
    }
  };

export const hprompt = hpromptc("template");
export const hpromptr = (otherFormatter: StringFormatter) =>
  hpromptc("template", otherFormatter);
