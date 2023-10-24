import { HeliconeAsyncOpenAI } from "./async_logger/HeliconeAsyncOpenAI";
import { IHeliconeAsyncClientOptions } from "./core/HeliconeClientOptions";
import { Response } from "openai/core";
import { HeliconeFeedbackRating } from "./core/HeliconeFeedback";
import { HeliconeProxyOpenAI } from "./proxy_logger/HeliconeProxyOpenAI";

require("dotenv").config();

// let feedbackCount = 0;
// let requestCount = 0;
// let updateCount = 0;
// let successFeedback = 0;
// let errorFeedback = 0;

// async function feedback(openAi: HeliconeProxyOpenAIApi) {
//   // Create chat completion
//   const result = await openAi.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: [
//       {
//         role: "user",
//         content: "Say hi!",
//       },
//     ],
//   });
//   requestCount++;

//   const heliconeId = result.headers["helicone-id"];
//   await delay(1000);

//   // Initial rating
//   const initialRating =
//     Math.random() < 0.7
//       ? HeliconeFeedbackRating.Positive
//       : HeliconeFeedbackRating.Negative;
//   await openAi.helicone.logFeedback(heliconeId, initialRating);
//   feedbackCount++;

//   // Randomly decide whether to update the rating (1 in 10 chance)
//   if (Math.random() < 0.2) {
//     const updatedRating =
//       initialRating === HeliconeFeedbackRating.Positive
//         ? HeliconeFeedbackRating.Negative
//         : HeliconeFeedbackRating.Positive;
//     await openAi.helicone.logFeedback(heliconeId, updatedRating);
//     updateCount++;
//   }
// }

// function delay(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// async function main() {
//   const config = new HeliconeProxyConfiguration(
//     {
//       apiKey: process.env.OPENAI_API_KEY,
//       heliconeMeta: {
//         apiKey: process.env.MY_HELICONE_API_KEY,
//         baseUrl: "http://127.0.0.1:8787/v1",
//       },
//     },
//     async (result: Response) => {
//       console.log(`Feedback result: ${result.status}`);
//       if (result.ok) {
//         successFeedback++;
//       } else {
//         errorFeedback++;
//       }
//     }
//   );

//   const openAi = new HeliconeProxyOpenAIApi(config);

//   // Run 1000 async feedback operations
//   await Promise.all(Array.from({ length: 15 }).map(() => feedback(openAi)));

//   await delay(2000);
//   console.log(
//     `Feedback: ${feedbackCount}, Requests: ${requestCount}, Updates: ${updateCount}, Success: ${successFeedback}, Error: ${errorFeedback}`
//   );
// }

async function test() {
  // const helicone = new HeliconeOpenAI({
  //   apiKey: process.env.OPENAI_API_KEY,
  //   organization: process.env.OPENAI_ORG_ID,
  //   baseURL: "https://oai.hconeai.com/v1",
  // });

  // const result = await helicone.completions.create({
  //   model: "davinci",
  //   prompt: "This is a test",
  // });

  // console.log(result);

  // const result2 = await helicone.chat.completions
  //   .create({
  //     model: "gpt-3.5-turbo",
  //     messages: [
  //       {
  //         role: "user",
  //         content: "Say hi!",
  //       },
  //     ],
  //   })
  //   .withResponse();

  // console.log(result2);

  const openai = new HeliconeAsyncOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    heliconeMeta: {
      apiKey: process.env.HELICONE_API_KEY,
      baseUrl: "https://api_staging.hconeai.com",
      onLog: async (response: Response) => {
        const heliconeId = response.headers.get("helicone-id");
        if (heliconeId) {
          await openai.helicone.logFeedback(
            heliconeId,
            HeliconeFeedbackRating.Positive
          );
        }
      },
      onFeedback: async (response: Response) => {
        console.log(`Feedback result: ${response.status}`);
      },
    },
  });

  // const { data, response } = await openai.chat.completions
  //   .create({
  //     model: "gpt-3.5-turbo",
  //     messages: [
  //       {
  //         role: "user",
  //         content: "Say 'TestAsync_ChatCompletion_NoStreaming'",
  //       },
  //     ],
  //   })
  //   .withResponse();

  // console.log(data.choices[0].message.content);

  const { data: dataStreaming, response: responseStreaming } =
    await openai.chat.completions
      .create(
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: "Tell me  a long story",
            },
          ],
          stream: true,
        },
        { stream: true }
      )
      .withResponse();

  const chunks: string[] = [];

  for await (const chunk of dataStreaming) {
    chunks.push(chunk.choices[0].delta.content ?? "");
  }

  console.log(`Streaming result: ${chunks.join("")}`);

  // const { data: data2, response: response2 } = await openai.completions
  //   .create({
  //     model: "davinci",
  //     prompt: "1+1=",
  //   })
  //   .withResponse();

  // console.log(data2.choices[0].text);

  // const { data: data3, response: response3 } = await openai.embeddings
  //   .create({
  //     input: "Hello, world!",
  //     model: "text-embedding-ada-002",
  //   })
  //   .withResponse();

  // console.log(data3.data[0].embedding); // Ugly, but works
}

async function testProxy() {
  const openai = new HeliconeProxyOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    heliconeMeta: {
      apiKey: process.env.HELICONE_API_KEY,
      onFeedback: async (response: Response) => {
        console.log(`Feedback result: ${response.status}`);
      },
    },
  });

  const { data, response } = await openai.chat.completions
    .create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'TestProxy_ChatCompletion_NoStreaming'",
        },
      ],
    })
    .withResponse();

  console.log(data.choices[0].message.content);

  const heliconeId = response.headers.get("helicone-id");
  if (heliconeId) {
    await openai.helicone.logFeedback(
      heliconeId,
      HeliconeFeedbackRating.Negative
    );
  }
}

test().then(() => {});
// testProxy().then(() => {});
