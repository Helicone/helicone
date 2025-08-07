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

  // Original example
  const chatCompletion = await openai.chat.completions
    .create({
      // model: "claude-3-5-sonnet-20240620/anthropic",
      model: "claude-3.5-sonnet/bedrock",
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

  console.log("Claude 3.5 Sonnet response:");
  console.log(JSON.stringify(chatCompletion.data, null, 2));

  // Example with Bedrock endpoint
  const bedrockCompletion = await openai.chat.completions
    .create({
      model: "us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant.`,
        },
        {
          role: "user",
          content: "What is the capital of France?",
        },
      ],
      max_tokens: 100,
    })
    .withResponse();

  console.log("\nBedrock Claude 3.7 Sonnet response:");
  console.log(JSON.stringify(bedrockCompletion.data, null, 2));

  // Example with Anthropic direct endpoint
  const anthropicCompletion = await openai.chat.completions
    .create({
      model: "claude-3-7-sonnet-20250219/anthropic",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant.`,
        },
        {
          role: "user",
          content: "Tell me a short joke.",
        },
      ],
      max_tokens: 100,
    })
    .withResponse();

  console.log("\nAnthropic Claude 3.7 Sonnet response:");
  console.log(JSON.stringify(anthropicCompletion.data, null, 2));

  // Example with fallback - comma separated models
  const fallbackCompletion = await openai.chat.completions
    .create({
      model: "us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock,claude-3-7-sonnet-20250219/anthropic",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant.`,
        },
        {
          role: "user",
          content: "What is 2 + 2?",
        },
      ],
      max_tokens: 50,
    })
    .withResponse();

  console.log("\nFallback example (tries Bedrock first, then Anthropic):");
  console.log(JSON.stringify(fallbackCompletion.data, null, 2));
}

main();
