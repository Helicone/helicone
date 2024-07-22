import {
  ChatCompletion,
  ChatCompletionCreateParams,
  ChatCompletionTool,
} from "openai/resources/chat";
import { Result } from "../../../lib/result";

interface OpenAIReq {
  messages: ChatCompletionCreateParams[];
  temperature: number;
  model: string;
  maxTokens: number;
  tools?: ChatCompletionTool[];
  requestId?: string;
  openAIApiKey?: string;
}

export const fetchOpenAI = async (props: OpenAIReq) => {
  const {
    messages,
    temperature,
    model,
    maxTokens,
    tools,
    requestId,
    openAIApiKey,
  } = props;
  const completion = await fetch("/api/open_ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      requestId,
      temperature,
      model,
      tools,
      maxTokens,
      openAIApiKey,
    }),
  }).then((res) => res.json() as Promise<Result<ChatCompletion, string>>);

  return completion;
};
