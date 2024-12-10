import { OpenAI } from "openai";
import { v4 as uuid } from "uuid";
import { hpf } from "@helicone/prompts";
import { HeliconeManualLogger } from "@helicone/helpers";
import { examples } from "./travelExamples";
import { OPENAI_KEY } from "../clients/constant";

async function getUsersTravelPlan(
  openai: OpenAI,
  example: (typeof examples)[0],
  sessionId: string
) {
  const prompt = hpf`As a travel planner, extract the user's travel plans from their request.

  ${{
    userMessage: JSON.stringify(example.userMessage),
  }}

  YOUR OUTPUT SHOULD BE IN THE FOLLOWING FORMAT:
  {
    "destination": string,
    "startDate": string,
    "endDate": string,
    "activities": string[]
  }`;

  const requestId = uuid();
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "extract-travel-plan",
        "Helicone-Session-Name": "XPedia Travel Planner",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/planning/extract-travel-plan`,
        "Helicone-User-Id": example.userId,
      },
    }
  );

  try {
    const result = JSON.parse(
      chatCompletion.choices[0].message.content || "{}"
    );
    return result;
  } catch (e) {
    console.error(e);
    return {};
  }
}

async function getTravelTips(
  openai: OpenAI,
  heliconeLogger: HeliconeManualLogger,
  example: (typeof examples)[0],
  sessionId: string,
  travelPlan: any
) {
  const destination = travelPlan?.destination || "unknown";

  const res = await heliconeLogger.logRequest(
    {
      _type: "vector_db",
      operation: "search",
      text: `Generate travel tips for ${destination}`,
      vector: [0.1, 0.2, 0.3, 0.4],
      topK: 5,
      filter: destination !== "unknown" ? { destination } : {},
      databaseName: "travel-tips",
      query: JSON.stringify({
        ...travelPlan,
        destination_parsed: destination !== "unknown",
      }),
    },
    async (resultRecorder) => {
      resultRecorder.appendResults({
        status: "failed",
        message: `No travel tips found with sufficient similarity for ${destination}`,
        similarityThreshold: 0.8,
        actualSimilarity: 0.5,
        metadata: {
          destination,
          destination_parsed: destination !== "unknown",
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      "Helicone-Property-Environment": "development",
      "Helicone-Session-Name": "XPedia Travel Planner",
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": `/planning/tips/vector-db`,
      "Helicone-User-Id": example.userId,
    }
  );

  const res2 = await heliconeLogger.logRequest(
    {
      _type: "tool",
      toolName: "TravelTipsAPI",
      input: {
        destination: travelPlan?.destination || "unknown",
        startDate: travelPlan?.startDate || "unknown",
        endDate: travelPlan?.endDate || "unknown",
        activities: Array.isArray(travelPlan?.activities)
          ? travelPlan.activities
          : ["general sightseeing"],
      },
      apiVersion: "v1",
      metadata: {
        timestamp: new Date().toISOString(),
      },
    },
    async (resultRecorder) => {
      // Simulate a successful tool call
      resultRecorder.appendResults({
        status: "success",
        message: `Successfully retrieved travel tips for ${
          travelPlan?.destination || "unknown"
        }`,
        tips: [
          "Visit the local museum",
          "Try the famous street food",
          "Explore the historic district",
        ],
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    },
    {
      "Helicone-Property-Environment": "development",
      "Helicone-Session-Name": "XPedia Travel Planner",
      "Helicone-Session-Id": sessionId,
      "Helicone-Session-Path": `/planning/tips/api-call`,
      "Helicone-User-Id": example.userId,
    }
  );

  const prompt = hpf`As a travel planner, generate travel tips based on the user's travel plans.

  ${{
    travelPlan: JSON.stringify(travelPlan),
  }}

  YOUR OUTPUT SHOULD BE IN THE FOLLOWING FORMAT:
  {
    "tips": string[]
  }`;

  const requestId = uuid();
  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [{ role: "system", content: prompt }],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Request-Id": requestId,
        "Helicone-Property-Environment": "development",
        "Helicone-Prompt-Id": "generate-travel-tips",
        "Helicone-Session-Name": "XPedia Travel Planner",
        "Helicone-Session-Id": sessionId,
        "Helicone-Session-Path": `/planning/tips/generation`,
        "Helicone-User-Id": example.userId,
      },
    }
  );

  try {
    const result = JSON.parse(
      chatCompletion.choices[0].message.content || "{}"
    );
    return result;
  } catch (e) {
    console.error(e);
    return {};
  }
}

async function processExample(
  openai: OpenAI,
  heliconeLogger: HeliconeManualLogger,
  example: (typeof examples)[0],
  sessionId: string
) {
  const travelPlan = await getUsersTravelPlan(openai, example, sessionId);

  const tips = await getTravelTips(
    openai,
    heliconeLogger,
    example,
    sessionId,
    travelPlan
  );

  return { travelPlan, tips };
}

export async function setupDemoOrganizationRequests({
  heliconeApiKey,
}: {
  heliconeApiKey: string;
}) {
  const heliconeWorkerUrl =
    process.env.HELICONE_WORKER_URL ?? "http://localhost:8787/v1";

  // const openai = new OpenAI({
  //   apiKey: OPENAI_KEY,
  //   baseURL: heliconeWorkerUrl,
  //   defaultHeaders: {
  //     "Helicone-Auth": `Bearer ${heliconeApiKey}`,
  //   },
  // });
  console.log(`Using Helicone Worker URL: ${heliconeWorkerUrl}`);

  const openai = new OpenAI({
    apiKey: OPENAI_KEY,
    baseURL: "http://localhost:8787/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${heliconeApiKey}`,
    },
  });

  const heliconeLogger = new HeliconeManualLogger({
    apiKey: heliconeApiKey,
    loggingEndpoint: `${
      process.env.HELICONE_API_WORKER_URL ?? ""
    }/custom/v1/log`,
  });

  for (const example of examples) {
    const sessionId = uuid();
    const { travelPlan, tips } = await processExample(
      openai,
      heliconeLogger,
      example,
      sessionId
    );
  }
}
