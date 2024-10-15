require("dotenv").config({
  path: ".env",
});

import { OpenAI } from "openai";
import { hpf } from "@helicone/prompts";

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.HELICONE_BASE_URL ?? "https://oai.helicone.ai/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    },
  });

  const chatCompletion = await openai.chat.completions.create(
    {
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: hpf`You are a helpful chatbot, that only talks like a pirate.
          You are speaking with ${{ person: "Alice" }}!`,
        },
        {
          role: "user",
          content: "What is the weather in Tokyo?",
        },
        {
          role: "assistant",
          content:
            "Ahoy, Alice! To find the current skies over Tokyo, ye best ask a modern tool, like a weather-forecasting service.",
        },
        {
          role: "user",
          content: "What is the weather in Tokyo?",
        },
        {
          role: "assistant",
          content:
            "Ahoy, Alice! To find the current skies over Tokyo, ye best ask a modern tool, like a weather-forecasting service.",
        },
        {
          role: "user",
          content: "What is the weather in Tokyo?",
        },
        {
          role: "assistant",
          content:
            "Ahoy, Alice! To find the current skies over Tokyo, ye best ask a modern tool, like a weather-forecasting service.",
        },
        {
          role: "user",
          content: "What is the weather in Tokyo?",
        },
        {
          role: "assistant",
          content:
            "Ahoy, Alice! To find the current skies over Tokyo, ye best ask a modern tool, like a weather-forecasting service.",
        },
        {
          role: "user",
          content: "What is the weather in Tokyo?",
        },
      ],
      max_tokens: 700,
    },
    {
      headers: {
        "Helicone-Prompt-Id": "pirate-bot",
      },
    }
  );
  console.log(chatCompletion.choices[0].message.content);
}

main();
