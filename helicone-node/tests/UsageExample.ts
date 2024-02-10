import { HeliconeAsyncOpenAI } from "../async_logger/HeliconeAsyncOpenAI";
import { Response } from "openai/core";
import { HeliconeFeedbackRating } from "../core/HeliconeFeedback";
import { HeliconeProxyOpenAI } from "../proxy_logger/HeliconeProxyOpenAI";
import * as dotenv from "dotenv";
import { hpmt } from "../core/HeliconePrompt";

dotenv.config();

async function testAsync(): Promise<void> {
  const scene = "a scene";
  const { builtString, heliconeTemplate, inputs } = hpmt`
  The scene is ${{ scene }}. test
 Just respond with "Hello", do not include punctuation hello.

 This is my new prompt. Make sure to not curse in your output.
`;

  const openai = new HeliconeAsyncOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID,
    heliconeMeta: {
      apiKey: process.env.HELICONE_API_KEY,
      baseUrl: "https://api.hconeai.com",
      onLog: async (response: Response) => {
        console.log(`Log result: ${response.status}`);
        const heliconeId = response.headers.get("helicone-id");
        if (heliconeId) {
          await openai.helicone.logFeedback(
            heliconeId,
            HeliconeFeedbackRating.Positive
          );

          await openai.helicone.logPrompt(
            heliconeId,
            "coleywoley",
            {
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: heliconeTemplate,
                },
                {
                  role: "user",
                  content: "Say 'TestAsync_ChatCompletion_NoStreaming'",
                },
              ],
            },
            inputs
          );
        }
      },
      onFeedback: async (response: Response) => {
        console.log(`Feedback result: ${response.status}`);
      },
    },
  });

  const data = await openai.chat.completions.create(
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: builtString,
        },
        {
          role: "user",
          content: "Say 'TestAsync_ChatCompletion_NoStreaming'",
        },
      ],
    },
    {
      headers: {
        "Helicone-Prompt-Id": "Prompt123",
      },
    }
  );

  console.log(data.choices[0].message.content);

  const { data: dataStreaming, response: responseStreaming } =
    await openai.chat.completions
      .create(
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: "Say what up",
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

  const { data: data3, response: response3 } = await openai.embeddings
    .create({
      input: "Hello, world!",
      model: "text-embedding-ada-002",
    })
    .withResponse();

  console.log(data3.data[0].embedding); // Ugly, but works

  return;
}

async function testProxy(): Promise<void> {
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

function withTimeout(promise: any, ms: any) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Promise timed out"));
    }, ms);

    promise
      .then((response: any) => {
        clearTimeout(timeout);
        resolve(response);
      })
      .catch((error: any) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

withTimeout(testAsync(), 10000)
  .then(() => {
    console.log("test() completed");
  })
  .catch((error) => {
    console.log("test() failed:", error);
  });

withTimeout(testProxy(), 5000)
  .then(() => {
    console.log("testProxy() completed");
  })
  .catch((error) => {
    console.log("testProxy() failed:", error);
  });
