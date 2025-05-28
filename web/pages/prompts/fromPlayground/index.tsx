import { LLMRequestBody } from "@helicone-package/llm-mapper/types";
import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import PromptEditor from "../../../components/templates/prompts/id/PromptEditor";

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

export default function Page() {
  return <PromptEditor basePrompt={defaultBasePrompt} />;
}

Page.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};
