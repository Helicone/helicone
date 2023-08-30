import { HeliconeFeedbackRating } from "./core/HeliconeOpenAIApi";
import { HeliconeProxyConfiguration } from "./core/HeliconeProxyConfiguration";
import { HeliconeProxyOpenAIApi } from "./proxy_logger/HeliconeProxyOpenAIApi";

require("dotenv").config();

let feedbackCount = 0;
let requestCount = 0;
let updateCount = 0;
let successFeedback = 0;
let errorFeedback = 0;

async function feedback(openAi: HeliconeProxyOpenAIApi) {
  // Create chat completion
  const result = await openAi.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: "Say hi!",
      },
    ],
  });
  requestCount++;

  const heliconeId = result.headers["helicone-id"];
  await delay(1000);

  // Initial rating
  const initialRating =
    Math.random() < 0.7
      ? HeliconeFeedbackRating.Positive
      : HeliconeFeedbackRating.Negative;
  await openAi.helicone.logFeedback(heliconeId, initialRating);
  feedbackCount++;

  // Randomly decide whether to update the rating (1 in 10 chance)
  if (Math.random() < 0.2) {
    const updatedRating =
      initialRating === HeliconeFeedbackRating.Positive
        ? HeliconeFeedbackRating.Negative
        : HeliconeFeedbackRating.Positive;
    await openAi.helicone.logFeedback(heliconeId, updatedRating);
    updateCount++;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const config = new HeliconeProxyConfiguration(
    {
      apiKey: process.env.OPENAI_API_KEY,
      heliconeMeta: {
        apiKey: process.env.MY_HELICONE_API_KEY,
        baseUrl: "http://127.0.0.1:8787/v1",
      },
    },
    async (result: Response) => {
      console.log(`Feedback result: ${result.status}`);
      if (result.ok) {
        successFeedback++;
      } else {
        errorFeedback++;
      }
    }
  );

  const openAi = new HeliconeProxyOpenAIApi(config);

  // Run 1000 async feedback operations
  await Promise.all(Array.from({ length: 50 }).map(() => feedback(openAi)));

  await delay(2000);
  console.log(
    `Feedback: ${feedbackCount}, Requests: ${requestCount}, Updates: ${updateCount}, Success: ${successFeedback}, Error: ${errorFeedback}`
  );
}

main().then(() => {});
