import PromptEditor from "./id/PromptEditor";
import { LLMRequestBody } from "@helicone-package/llm-mapper/types";

const PromptFromPlaygroundShell = () => {
  const defaultBasePrompt = {
    body: {
      model: "gpt-4o-mini",
      messages: [
        {
          _type: "message",
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          _type: "message",
          role: "user",
          content: 'What is 2+<helicone-prompt-input key="number" />?',
        },
      ],
    } as LLMRequestBody,
    metadata: {
      provider: "OPENAI",
      isProduction: true,
      inputs: {
        number: "2",
      },
    },
  };

  return <PromptEditor basePrompt={defaultBasePrompt} />;
};

export default PromptFromPlaygroundShell;
