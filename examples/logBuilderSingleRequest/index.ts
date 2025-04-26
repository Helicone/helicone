import { HeliconeManualLogger } from "@helicone/helpers";
import OpenAI from "openai";
import dotenv from "dotenv";
import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const helicone = new HeliconeManualLogger({
  apiKey: process.env.HELICONE_API_KEY!,
  // loggingEndpoint: "http://localhost:8585/v1/trace/custom/log",
  loggingEndpoint: "https://api.helicone.ai/v1/trace/custom/log",
  headers: {
    "Helicone-Property-appname": "OpenAIExample",
  },
});

const REQUEST_BODY = {
  model: "gpt-4.1",
  messages: [{ role: "user", content: "Hello" }],
  max_tokens: 4096,
  temperature: 0.5,
  user: "fksajlkfasjd",
  tools: undefined,
  tool_choice: undefined,
  response_format: undefined,
} as ChatCompletionCreateParamsNonStreaming;

// With Error capture
async function captureError() {
  const heliconeLogBuilder = helicone.logBuilder(REQUEST_BODY, {
    "Helicone-Property-workspace_id": "fksajlkfasjd",
    "Helicone-Property-caller_function": "testtest",
  });
  try {
    const completion = await openai.chat.completions.create(REQUEST_BODY);
    heliconeLogBuilder.setResponse(JSON.stringify(completion));
  } catch (error) {
    heliconeLogBuilder.setError(error);
  } finally {
    try {
      await heliconeLogBuilder.sendLog();
    } catch (error) {
      console.error("Error sending non-streaming log to Helicone:", error);
    }
  }
}

// fire and forget
async function simpleNoErrorCapture() {
  const completion = await openai.chat.completions.create(REQUEST_BODY);
  helicone.logSingleRequest(REQUEST_BODY, JSON.stringify(completion), {
    "Helicone-Property-workspace_id": "fksajlkfasjd",
    "Helicone-Property-caller_function": "testtest",
  });
}

async function main() {
  await captureError();
  await simpleNoErrorCapture();
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("Error in main function:", error);
    process.exit(1);
  });
}
