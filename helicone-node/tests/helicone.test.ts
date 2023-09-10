import { v4 as uuidv4 } from "uuid";
import { HeliconeAsyncConfiguration } from "../core/HeliconeAsyncConfiguration";
import {
  HeliconeLogBuilder,
  HeliconeLogger,
  ResponseBody,
} from "../async_logger/HeliconeLogger";

const heliconeApiKey = process.env.HELICONE_API_KEY;

if (!heliconeApiKey) {
  throw new Error("API keys must be set as environment variables.");
}

// Test cache behavior
test("customModel", async () => {
  const config = new HeliconeAsyncConfiguration({
    heliconeMeta: {
      apiKey: process.env.MY_HELICONE_API_KEY,
      baseUrl: "http://127.0.0.1:8788",
    },
  });

  const logger = new HeliconeLogger(config);

  const llmArgs = {
    model: "llama-2",
    prompt: "Say hi!",
  };
  const builder = new HeliconeLogBuilder(llmArgs);

  /* 
  result = callToLLM(llmArgs)
  */
  const result: ResponseBody = {
    text: "This is my response",
    usage: {
      total_tokens: 13,
      prompt_tokens: 5,
      completion_tokens: 8,
    },
  };

  builder.addResponse(result);
  builder.addUser("test-user");
  const response = await logger.submit(builder);
  if (response.status !== 200) {
    throw new Error(response.data);
  }
}, 60000);
