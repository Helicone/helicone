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
  const requestId = uuid();

  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [
        {
          role: "user",
          content: hprompt`
Are you a cat?
          `,
        },
      ],
      model: "gpt-4o",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-testing": "true",
        "Helicone-Prompt-Id": "taxes_assistant",
      },
    }
  );
  console.log(chatCompletion);
}

const heliconeClient = new HeliconeAPIClient({
  apiKey: process.env.HELICONE_API_KEY ?? "",
  baseURL: "http://127.0.0.1:8585", // "https://api.helicone.ai/v1",
});

async function scoreAnyUnscoredRequestsForHypothesesRuns() {
  const worker = heliconeClient.scoringWorker();

  await worker.start(
    async (request, requestAndResponse) => {
      request.response_status;
      console.log("Scoring...", request.request_id);
      const responseText =
        requestAndResponse.response.choices[0].message.content;

      const containsReasoning = responseText.includes("<reasoning>");
      return {
        scores: {
          containsReasoning,
          contentNewLineCount: responseText.split("\n").length,
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
