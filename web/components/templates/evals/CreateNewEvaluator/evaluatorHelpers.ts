interface ChoiceScore {
  score: number;
  description: string;
}

export interface OpenAIFunctionParams {
  name: string;
  description: string;
  expectedValueType: "boolean" | "choice" | "range";
  choiceScores?: ChoiceScore[];
  rangeMin?: number;
  rangeMax?: number;
  includedVariables?: {
    inputs: boolean;
    promptTemplate: boolean;
    inputBody: boolean;
    outputBody: boolean;
  };
}

export function generateOpenAIFunction({
  name,
  description,
  expectedValueType,
  choiceScores,
  rangeMin,
  rangeMax,
}: OpenAIFunctionParams): string {
  const baseFunction = {
    name: "scorer",
    description: `Given the inputs as shown in the system message and the output. Please call the scorer function.`,
    parameters: {
      type: "object",
      properties: {
        [name]: {
          description: description,
        } as any,
      },
      required: [name],
    },
  };

  switch (expectedValueType) {
    case "boolean":
      baseFunction.parameters.properties[name].type = "boolean";
      break;
    case "choice":
      baseFunction.parameters.properties[name].type = "integer";
      baseFunction.parameters.properties[name].oneOf = choiceScores?.map(
        (choice) => ({
          const: choice.score,
          title: choice.description,
        })
      );
      break;
    case "range":
      baseFunction.parameters.properties[name].type = "number";
      baseFunction.parameters.properties[name].minimum = rangeMin;
      baseFunction.parameters.properties[name].maximum = rangeMax;
      break;
  }

  return JSON.stringify(baseFunction, null, 2);
}

export function OpenAIFunctionToFunctionParams(
  expectedValueType: "LLM-BOOLEAN" | "LLM-CHOICE" | "LLM-RANGE",
  template:
    | {
        name: string;
        description: string;
        parameters: {
          type: string;
          properties: {
            [key: string]: {
              description: string;
              type: string;
              oneOf?: { const: number; title: string }[];
              minimum?: number;
              maximum?: number;
            };
          };
          required: string[];
        };
      }
    | undefined
): OpenAIFunctionParams {
  if (!template || !template?.parameters?.properties) {
    return {
      name: "",
      description: "",
      expectedValueType: "boolean",
    };
  }

  // Get the first property key since OpenAI functions only have one property
  const propertyKey = Object.keys(template.parameters.properties)[0];
  const property = template.parameters.properties[propertyKey];

  const params: OpenAIFunctionParams = {
    name: propertyKey,
    description: property.description,
    expectedValueType: expectedValueType.split("-")[1].toLowerCase() as
      | "boolean"
      | "choice"
      | "range",
  };

  // Add additional parameters based on the expectedValueType
  switch (expectedValueType) {
    case "LLM-CHOICE":
      params.choiceScores = property.oneOf?.map((choice) => ({
        score: choice.const,
        description: choice.title,
      }));
      break;
    case "LLM-RANGE":
      params.rangeMin = property.minimum;
      params.rangeMax = property.maximum;
      break;
    case "LLM-BOOLEAN":
      params.expectedValueType = "boolean";
      break;
  }

  return params;
}

export function generateOpenAITemplate({
  name,
  description,
  expectedValueType,
  choiceScores,
  rangeMin,
  rangeMax,
  model,
  includedVariables,
}: OpenAIFunctionParams & {
  model: string;
  includedVariables?: {
    inputs: boolean;
    promptTemplate: boolean;
    inputBody: boolean;
    outputBody: boolean;
  };
}): string {
  return JSON.stringify(
    {
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please call the scorer function and use the following context to evaluate the output.



${
  includedVariables?.inputs
    ? `Here were the inputs into the LLM:
### INPUT BEGIN ###
<helicone-prompt-input key="inputs" />
### INPUT END ###`
    : ""
}

${
  includedVariables?.outputBody
    ? `Here was the output of the LLM:
### OUTPUT BEGIN ###
<helicone-prompt-input key="outputBody" />
### OUTPUT END ###`
    : ""
}

${
  includedVariables?.promptTemplate
    ? `Here was the prompt template used:
### PROMPT TEMPLATE BEGIN ###
<helicone-prompt-input key="promptTemplate" />
### PROMPT TEMPLATE END ###`
    : ""
}

${
  includedVariables?.inputBody
    ? `Here was the input body:
### INPUT BODY BEGIN ###
<helicone-prompt-input key="inputBody" />
### INPUT BODY END ###`
    : ""
}
`,
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 1,
      model,
      tools: [
        {
          type: "function",
          function: JSON.parse(
            generateOpenAIFunction({
              name,
              description,
              expectedValueType,
              choiceScores,
              rangeMin,
              rangeMax,
            })
          ),
        },
      ],
    },
    null,
    2
  );
}

export function openAITemplateToOpenAIFunctionParams(
  template: any,
  scoringType: "LLM-BOOLEAN" | "LLM-CHOICE" | "LLM-RANGE"
): OpenAIFunctionParams & { model: string } {
  const parsedTemplate = template;
  return {
    ...OpenAIFunctionToFunctionParams(
      scoringType,
      parsedTemplate.tools[0].function
    ),
    model: parsedTemplate.model,
  };
}
