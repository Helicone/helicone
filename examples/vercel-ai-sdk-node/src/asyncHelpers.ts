import { createOpenAI } from "@ai-sdk/openai";
import { HeliconePromptManager } from "@helicone/helpers";
import { generateText } from "ai";
import { ChatCompletionCreateParams } from "openai/resources/chat/completions";

const openai = createOpenAI({
  baseURL: "https://oai.helicone.ai/v1",
  apiKey: process.env.OPENAI_API_KEY!,
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

export async function asyncHelpersExample() {
  const promptManager = new HeliconePromptManager({
    apiKey: process.env.HELICONE_API_KEY!,
  });

  // Get compiled chat completion body with variable substitution
  const { body, errors } = await promptManager.getPromptBody({
    prompt_id: "4brRex",
    model: "gpt-4o-mini",
    inputs: {
      name: "bob",
    },
    messages: [
      {
        role: "user",
        content: "Hello world",
      },
    ],
    stream: false,
  });

  if (errors.length > 0) {
    console.warn("Validation errors:", errors);
  }

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: getPrompt(body),
    // use your prompt_id here
    prompt_id: "4brRex",
    inputs: { name: "bob" },
  } as any);
  console.log(text);
}

function getPrompt(params: ChatCompletionCreateParams): string {
  if (!params.messages || !Array.isArray(params.messages)) {
    return "";
  }

  return params.messages
    .map((message) => {
      const role = message.role;

      if ("content" in message && message.content) {
        if (typeof message.content === "string") {
          return `${role}: ${message.content}`;
        } else if (Array.isArray(message.content)) {
          const contentParts = message.content
            .map((part) => {
              if (part.type === "text") {
                return part.text;
              } else if (part.type === "image_url") {
                return "[image]";
              }
              return "";
            })
            .filter(Boolean)
            .join(" ");
          return `${role}: ${contentParts}`;
        }
      }

      return `${role}: [no content]`;
    })
    .join("\n");
}
