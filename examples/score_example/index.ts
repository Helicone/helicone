require("dotenv").config({
  path: ".env",
});
import { OpenAI } from "openai";
import { hprompt, HeliconeAPIClient } from "@helicone/helicone";
import { v4 as uuid } from "uuid";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "http://localhost:8787/v1", //"https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

async function main() {
  while (true) {
    //sleep for 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const requestId = uuid();

    const chatCompletion = await openai.chat.completions.create(
      {
        messages: [
          {
            role: "user",
            content: `Respond only hello world`,
          },
        ],
        model: "gpt-3.5-turbo",
      },
      {
        headers: {
          "Helicone-Request-Id": requestId,
          // "Helicone-Property-testing": "true",
          // "Helicone-Prompt-Id": "taxes_assistant",
        },
      }
    );
    console.log(chatCompletion);
  }
}

const heliconeClient = new HeliconeAPIClient({
  apiKey: process.env.HELICONE_API_KEY ?? "",
  baseURL: "http://127.0.0.1:8585", // "https://api.helicone.ai/v1",
});

async function scoreAnyUnscoredRequestsForHypothesesRuns() {
  const worker = heliconeClient.scoringWorker();

  await worker.start(
    async (request, requestAndResponse) => {
      const responseText =
        requestAndResponse.response.choices[0].message.content;

      const containsReasoning = Math.random() > 0.5;
      return {
        scores: {
          "Contains Reasoning": containsReasoning,
          "Contains New-Line": responseText.split("\n").length,
          "Random Score": Math.floor(Math.random() * 100),
        },
      };
    },
    // Optional filters if you want to refine what requests to query
    {
      filter: "all",
      isScored: false,
    }
  );
}

scoreAnyUnscoredRequestsForHypothesesRuns();

main();
