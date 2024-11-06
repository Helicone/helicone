require("dotenv").config({
  path: ".env",
});
import { OpenAI } from "openai";
// import { hprompt, HeliconeAPIClient } from "@helicone/helicone";
import { v4 as uuid } from "uuid";
import { hpf } from "@helicone/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

async function main() {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const requestId = uuid();
    const names = ["John", "Jane", "Jim", "Jill"];

    const stream = await openai.chat.completions.create(
      {
        messages: [
          {
            role: "user",
            content: hpf`Respond Say hellow to ${{
              name: names[Math.floor(Math.random() * names.length)],
            }}`,
          },
        ],
        model: "gpt-3.5-turbo",
        stream: true, // Enable streaming
      },
      {
        headers: {
          "Helicone-Request-Id": requestId,
          "Helicone-Property-Environment": "development",
          "Helicone-Prompt-Id": "say-hello-to",
          "helicone-stream-usage": "true",
        },
      }
    );

    // Process the stream

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      console.log(content);
    }
  }
}

// const heliconeClient = new HeliconeAPIClient({
//   apiKey: process.env.HELICONE_API_KEY ?? "",
//   baseURL: "http://127.0.0.1:8585", // "https://api.helicone.ai/v1",
// });

// async function scoreAnyUnscoredRequestsForHypothesesRuns() {
//   const worker = heliconeClient.scoringWorker();

//   await worker.start(
//     async (request, requestAndResponse) => {
//       const responseText =
//         requestAndResponse.response.choices[0].message.content;

//       const containsReasoning = Math.random() > 0.5;
//       return {
//         scores: {
//           "Contains Reasoning": containsReasoning,
//           "Contains New-Line": responseText.split("\n").length,
//           "Random Score": Math.floor(Math.random() * 100),
//         },
//       };
//     },
//     // Optional filters if you want to refine what requests to query
//     {
//       filter: "all",
//       isScored: false,
//     }
//   );
// }

// scoreAnyUnscoredRequestsForHypothesesRuns();

main();
