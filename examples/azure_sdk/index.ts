require("dotenv").config();

import { AzureOpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";

async function main() {
  // const anthropic = new Anthropic({
  //   baseURL: "http://localhost:58274",
  //   apiKey: process.env.ANTHROPIC_API_KEY,
  // });

  // const response = await anthropic.messages.create({
  //   model: "claude-3-opus-20240229",
  //   max_tokens: 1024,
  //   messages: [{ role: "user", content: "Hello, world" }],
  //   // stream: true,
  // });

  // console.log(response);

  // return;
  const openai = new AzureOpenAI({
    apiKey: process.env.AZURE_API_KEY,
    endpoint: process.env.AZURE_ENDPOINT,
    deployment: config.deploymentName,
    apiVersion: config.apiVersion,
    httpAgent: undefined,
  });

  // const openai = new AzureOpenAI({
  //   apiKey: p"b2918d6f51c94327a6a4bf7b8b0fbd1e,

  //   baseURL: "https://gateway.llmmapper.com/oai2ant/v1",
  // });
  const model = "claude-3-haiku-20240307";
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "Tell me a short joke about programming.",
        },
      ],
      max_tokens: 100,
      // stream: true,
    });

    console.log(chatCompletion);
    console.log(typeof chatCompletion);
    console.log(chatCompletion.choices[0].message.content);
    // for await (const chunk of chatCompletion) {
    //   console.log(chunk.choices[0].delta.content);
    // }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
