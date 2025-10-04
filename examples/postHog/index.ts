require("dotenv").config({
  path: ".env",
});

import { hprompt } from "@helicone/helicone";
import { OpenAI } from "openai";

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.HELICONE_BASE_URL ?? "https://oai.helicone.ai/v1",

    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    },
  });

  const scenes = [
    "beach",
    "forest",
    "city",
    "space",
    "desert",
    "mountain",
    "lake",
    "river",
  ];

  const scene = scenes[Math.floor(Math.random() * scenes.length)];

  const characterCount = Math.floor(Math.random() * 100) + 1;

  const sentenceCount = Math.floor(Math.random() * 3) + 1;

  const models = ["gpt-3.5-turbo", "gpt-4-turbo", "gpt-4o"];

  const environments = ["production", "development", "preview"];
  console.log("Running main function");

  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [
        {
          role: "user",
          // 2: Add hprompt to any string, and nest any variable in additional brackets `{}`
          content: hprompt`Please write a story about ${{
            scene,
          }} with ${{ characterCount }} characters and ${{
            sentenceCount,
          }} sentences.`,
        },
      ],
      model: models[Math.floor(Math.random() * models.length)],
      stream: true,
      // stream: true,
    },
    {
      // 3. Add Prompt Id Header
      headers: {
        "Helicone-Prompt-Id": "story-prompt-3",
        "Helicone-Property-Environment":
          environments[Math.floor(Math.random() * environments.length)],
        "Helicone-Posthog-Key": process.env.POSTHOG_API_KEY,
      },
    },
  );
  // console.log(chatCompletion.choices[0].message.content);
}

main();
if (process.env.LOOP === "true") {
  const MIN_TIME = 1000 * 60 * 5; // 5 minutes
  const MAX_TIME = 1000 * 60 * 10; // 10 minutes

  const loop = async () => {
    console.log("Running main function");
    await main();
    setTimeout(
      loop,
      Math.floor(Math.random() * (MAX_TIME - MIN_TIME)) + MIN_TIME,
    );
  };

  loop();
}
