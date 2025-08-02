import { OpenAI } from "openai";
import { config } from "dotenv";
config({
  path: ".env",
});

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.HELICONE_API_KEY,
    baseURL: process.env.HELICONE_BASE_URL ?? "https://ai-gateway.helicone.ai",
  });

  const chatCompletion = await openai.chat.completions
    .create({
      model:
        "gpt-4.1-nano/openai,claude-3-5-sonnet-20240620/anthropic,anthropic.claude-3-5-sonnet-20240620-v1:0/bedrock",
      messages: [
        {
          role: "system",
          content: `You are a helpful chatbot, that only talks like a pirate.
          You are speaking with Alice!`,
        },
        {
          role: "user",
          content: "What's the weather like in London?",
        },
      ],
      max_tokens: 700,
    })
    .withResponse();

  console.log(JSON.stringify(chatCompletion.data, null, 2));

  console.log(chatCompletion.response.headers);
}

main();
