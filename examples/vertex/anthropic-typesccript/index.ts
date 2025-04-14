require("dotenv").config({
  path: ".env",
});

import { AnthropicVertex } from "@anthropic-ai/vertex-sdk";

import { GoogleAuth } from "google-auth-library";

async function fetchAnthropic(url: any, init?: any): Promise<Response> {
  try {
    const response = await fetch(url, init);

    const retryAfter = response.headers.get("Retry-After");

    if (retryAfter) {
      console.log(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`);

      await new Promise((resolve) =>
        setTimeout(resolve, (Number(retryAfter) + 1) * 1000)
      );

      return fetch(url, init);
    }

    if (response.status === 529) {
      console.log("overloaded_error");

      await new Promise((resolve) => setTimeout(resolve, 5000));

      return fetch(url, init);
    }

    return response;
  } catch (err) {
    console.log("Error fetching data", err);

    throw err;
  }
}

const client = new AnthropicVertex({
  baseURL: "https://gateway.helicone.ai/v1",
  // baseURL: "http://localhost:8788/v1",
  projectId: process.env.ANTHROPIC_VERTEX_PROJECT_ID,
  region: process.env.CLOUD_ML_REGION,
  googleAuth: new GoogleAuth(),
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Target-URL": `https://${process.env.CLOUD_ML_REGION}-aiplatform.googleapis.com`,
    "User-Agent": "node-fetch",
  },
  fetch: fetchAnthropic,
  maxRetries: 3,
});

async function main() {
  const stream = await client.messages.create({
    model: "claude-3-5-sonnet-v2@20241022",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: "Hey Claude!",
      },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      const content = chunk.delta.text;
      //sleep for 1 second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(content);
    }
  }
  console.log("\nStream completed");
}

main().catch(console.error);
