import { OpenAI } from "openai";
import { config } from "dotenv";
config({
  path: ".env",
});

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://x.helicone.ai/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    },
  });

  try {
    const response = await openai.chat.completions.create({
      model: "grok-4-latest",
      messages: [{ role: "user", content: "Hello, how are you?" }],
      max_tokens: 1024,
      temperature: 0.7,
    });

    console.log(response);
  } catch (error) {
    console.error("Error creating completion:", error);
  }
}

main();
