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
  (type: "raw" | "template", ...otherFormaters: StringFormatter[]) =>
  (strings: TemplateStringsArray, ...values: any[]): string => {
    const rawParts: string[] = [];
    const templateParts: string[] = [];

    for (let i = 0; i < strings.length; i++) {
      rawParts.push(strings[i]);
      templateParts.push(strings[i]);
      if (values[i] != null) {
        const value =
          typeof values[i] === "object"
            ? Object.values(values[i])[0]
            : values[i];
        rawParts.push(value as string);
        if (typeof values[i] === "object") {
          templateParts.push(
            `<helicone-prompt-input key="${Object.keys(values[i])[0]}" >${
              value as string
            }</helicone-prompt-input>`
          );
        } else {
          templateParts.push(value as string);
        }
      }
    }

    const returnedString =
      type === "template" ? templateParts.join("") : rawParts.join("");

    if (otherFormaters.length === 0) {
      return returnedString;
    }

    return otherFormaters.reduce(
      (acc, formatter) => formatter`${acc}`,
      returnedString
    );
  };

export const hprompt = hpromptc("template");
