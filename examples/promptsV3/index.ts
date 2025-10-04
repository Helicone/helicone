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

  const names = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
    "Hannah",
    "Isaac",
    "Jack",
    "Liam",
    "Mason",
    "Noah",
    "Olivia",
    "Pam",
    "Quinn",
    "Rachel",
    "Sarah",
    "Tara",
    "Uma",
    "Victoria",
    "Wendy",
    "Xander",
    "Yara",
    "Zara",
  ];

  const chatCompletion = await openai.chat.completions.create(
    {
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: hpf`You are a helpful chatbot, that only talks like a pirate.
          You are speaking with ${{
            person: names[Math.floor(Math.random() * names.length)],
          }}!`,
        },
      ],
      max_tokens: 700,
    },
    {
      headers: {
        "Helicone-Prompt-Id": "pirate-bot",
      },
    },
  );
  console.log(chatCompletion.choices[0].message.content);
}

main();
