import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});
import OpenAI from "openai";
// import { hprompt, HeliconeAPIClient } from "@helicone/helicone";
import { v4 as uuid } from "uuid";
import { hpf } from "@helicone/prompts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "http://localhost:8787/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

async function main() {
  const prompt = hpf`
  As a QA engineer, simulate the execution of the following test cases:

  ${{
    cases: "JUSTIN JUsTIN",
  }}

  Provide a mock execution result for each test case, including any potential issues or bugs found.

  YOUR OUTPUT MUST BE IN THE FOLLOWING JSON FORMAT:
  {
    "executionResults": [
      {
        "testName": string,
        "status": "PASS" | "FAIL",
        "notes": string,
        "bugs": string[]
      }
    ]
  }
  `;

  const requestId = uuid();
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "Hello" },
      ],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "tino-test2",
        "Helicone-Session-Name": "QA Wolf",
      },
    }
  );

  try {
    return JSON.parse(chatCompletion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error parsing response:", error);
    return {};
  }
}

main();
