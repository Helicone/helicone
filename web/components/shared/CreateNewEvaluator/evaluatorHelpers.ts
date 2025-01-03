interface ChoiceScore {
  score: number;
  description: string;
}

interface OpenAIFunctionParams {
  name: string;
  description: string;
  expectedValueType: "boolean" | "choice" | "range";
  choiceScores?: ChoiceScore[];
  rangeMin?: number;
  rangeMax?: number;
}

function generateOpenAIFunction({
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

export function generateOpenAITemplate({
  name,
  description,
  expectedValueType,
  choiceScores,
  rangeMin,
  rangeMax,
  model,
}: OpenAIFunctionParams & {
  model: string;
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

Here were the inputs into the LLM:
### INPUT BEGIN ###
<helicone-prompt-input key="inputs" />
### INPUT END ###

Here was the output of the LLM:
### OUTPUT BEGIN ###
<helicone-prompt-input key="outputs" />
### OUTPUT END ###`,
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
