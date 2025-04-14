require("dotenv").config({
  path: ".env",
});

import Together from "together-ai";
import { HeliconeAsyncLogger } from "@helicone/async";

export function createTogetherClient() {
  const logger = new HeliconeAsyncLogger({
    apiKey: process.env.HELICONE_API_KEY ?? "",
    headers: {
      "Helicone-Property-appname": "TogetherChat",
    },
    providers: {
      together: Together,
    },
  });
  logger.init();

  return new Together();
}

const client = createTogetherClient();

async function main() {
  const response = await client.chat.completions.create({
    model: "Qwen/Qwen2.5-7B-Instruct-Turbo",
    messages: [{ role: "user", content: "Hello, world!" }],
    stream: true,
  });

  for await (const chunk of response) {
    console.log(chunk);
  }
}

main();
