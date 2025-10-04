require("dotenv").config({
  path: ".env",
});

import OpenAI from "openai";
import { HeliconeAsyncLogger } from "@helicone/async";

export function createOpenAIClient() {
  const logger = new HeliconeAsyncLogger({
    apiKey: process.env.HELICONE_API_KEY ?? "",
    providers: {
      openAI: OpenAI,
    },
  });
  logger.init();

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "",
  });
}

const client = createOpenAIClient();

async function main() {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Hello, world!" }],
  });

  console.log(response.choices[0].message.content);
}

main();
