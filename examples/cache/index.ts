// require("dotenv").config({
//   path: ".env",
// });

import { OpenAI } from "openai";
import { config } from "dotenv";
config({ path: ".env" });

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.HELICONE_BASE_URL,
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      // "Helicone-Cache-Enabled": "true",
      // "Helicone-Cache-Bucket-Max-Size": "3",
    },
  });

  const chatCompletion = await openai.chat.completions
    .create(
      {
        model: "openai/gpt-5-mini",
        reasoning_effort: "low",
        // verbosity: "high",
        messages: [
          // {
          //   role: "system",
          //   content: `You are a helpful chatbot, that only talks like a pirate.
          // You are speaking with Alice!`,
          // },
          {
            role: "user",
            content: "Write a haiku about a boy and his first pet dog",
          },
        ],
        // max_tokens: 700,

        // stream: true,
        // stream_options: {
        //   include_usage: true,
        // },
      }
      // {
      //   headers: {
      //     "Helicone-Cache-Enabled": "true",
      //     "Helicone-Cache-Bucket-Max-Size": "3",
      //   },
      // }
    )
    .withResponse();

  console.log(JSON.stringify(chatCompletion.data, null, 2));

  console.log(chatCompletion.response.headers);
}

main();
