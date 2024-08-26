require("dotenv").config({
  path: ".env",
});

import { HeliconeAsyncLogger, hprompt } from "@helicone/helicone";
import { OpenAI } from "openai";

async function main() {
  const logger = new HeliconeAsyncLogger({
    apiKey: process.env.HELICONE_API_KEY,
    providers: {
      openAI: OpenAI,
    },
  });
  logger.init();

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "I need help with my taxes",
      },
    ],
    model: "gpt-4",
  });
  console.log(chatCompletion.choices[0].message.content);
}

main();
