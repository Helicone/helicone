require("dotenv").config({
  path: ".env",
});
import { OpenAI } from "openai";
// import { hprompt, HeliconeAPIClient } from "@helicone/helicone";
import { v4 as uuid } from "uuid";
import { hpf } from "@helicone/prompts";
import { examples } from "./examples";

const sessionId = uuid();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "http://localhost:8787/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

async function analyzePageStructure(example: (typeof examples)[0]) {
  const prompt = hpf`
  As a QA engineer, analyze the structure of the following page:

  ${{
    page: example.page,
  }}

  Provide a high-level overview of the page components and their purposes.

  YOUR OUTPUT SHOULD BE IN THE FOLLOWING FORMAT:
  {
    "components": [
      {
        "name": string,
        "purpose": string
      }
    ]
  }
  `;

  const requestId = uuid();
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "qa-structure-analysis",
        "Helicone-Session-Name": "QA Wolf",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/${example.page}/structure-analysis`,
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

async function identifyInteractiveElements(example: (typeof examples)[0]) {
  const prompt = hpf`
  As a QA engineer, identify all interactive elements (buttons, links, inputs) on the following page:

  ${{
    page: example.page,
  }}

  ${{
    code: example.jsx
      .split("\n")
      .map((line, index) => `  ${index + 1}: ${line}`)
      .join("\n"),
  }}

  YOUR OUTPUT MUST BE IN THE FOLLOWING JSON FORMAT:
  {
    "elements": [
      {
        "type": string,
        "line": number,
        "text": string,
        "code": string
      }
    ]
  }
  `;

  const requestId = uuid();
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "qa-interactive-elements",
        "Helicone-Session-Name": "QA Wolf",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/${example.page}/interactive-elements`,
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

async function generateTestCases(
  pageStructure: any,
  interactiveElements: any,
  example: (typeof examples)[0]
) {
  const prompt = hpf`
  As a QA engineer, generate test cases for the following page structure and interactive elements:

  Page Structure:
  ${{
    structure: JSON.stringify(pageStructure, null, 2),
  }}

  Interactive Elements:
  ${{
    elements: JSON.stringify(interactiveElements, null, 2),
  }}

  Generate at least 3 test cases that cover different aspects of the page functionality.

  YOUR OUTPUT MUST BE IN THE FOLLOWING JSON FORMAT:
  {
    "testCases": [
      {
        "name": string,
        "steps": string[],
        "expectedResult": string
      }
    ]
  }
  `;

  const requestId = uuid();
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "qa-test-cases",
        "Helicone-Session-Name": "QA Wolf",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/${example.page}/generate-test-cases`,
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

async function simulateTestExecution(
  testCases: any,
  example: (typeof examples)[0]
) {
  const prompt = hpf`
  As a QA engineer, simulate the execution of the following test cases:

  ${{
    cases: JSON.stringify(testCases, null, 2),
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
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "qa-test-execution",
        "Helicone-Session-Name": "QA Wolf",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/${example.page}/simulate-test-execution`,
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

async function processExample(example: (typeof examples)[0]) {
  console.log(`Starting QA process for ${example.page}...`);

  const [pageStructure, interactiveElements] = await Promise.all([
    analyzePageStructure(example),
    identifyInteractiveElements(example),
  ]);

  console.log("Page Structure Analysis:", pageStructure);
  console.log("Interactive Elements:", interactiveElements);

  const testCases = await generateTestCases(
    pageStructure,
    interactiveElements,
    example
  );
  console.log("Generated Test Cases:", testCases);

  const executionResults = await simulateTestExecution(testCases, example);
  console.log("Test Execution Results:", executionResults);

  console.log(`QA process completed for ${example.page}`);
}

async function main() {
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [{ role: "user", content: "HELLO WORLD" }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {},
    }
  );
  // await Promise.all(
  //   [examples[0]].map(async (example) => {
  //     processExample(example);
  //   })
  // );
}

main();
