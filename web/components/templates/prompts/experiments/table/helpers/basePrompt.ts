import { PromptObject } from "../../../id/promptPlayground";

const baseExperimentPrompt: PromptObject = {
  model: "gpt-4o-mini",
  messages: [
    {
      id: "1",
      role: "user",
      content: "Hi, what can I do in experiments?",
      _type: "message",
    },
    {
      id: "2",
      role: "assistant",
      content:
        "Welcome to the experiments page! This is a space where you can test your prompt with different models, inputs and parameters to see how it performs and get insights on how to improve it!",
      _type: "message",
    },
    {
      id: "3",
      role: "user",
      content: `What is the average temperature in <helicone-prompt-input key="city" /> ?`,
      _type: "message",
    },
  ],
};

function generateRandomPostfix(length: number = 4): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const generateBasePromptName = `city-temperature-prompt-${generateRandomPostfix()}`;

export function getExampleExperimentPrompt() {
  const generateBasePromptName = `city-temperature-prompt-${generateRandomPostfix()}`;
  return {
    promptName: generateBasePromptName,
    basePrompt: baseExperimentPrompt,
  };
}
