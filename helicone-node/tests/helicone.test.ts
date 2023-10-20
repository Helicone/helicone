import {
  HeliconeLogBuilder,
  HeliconeLogger,
  ResponseBody,
} from "../async_logger/HeliconeLogger";
import { IHeliconeAsyncClientOptions } from "../core/HeliconeClientOptions";

const heliconeApiKey = process.env.HELICONE_API_KEY;

const asyncURL = process.env.HELICONE_ASYNC_URL ?? "http://127.0.0.1:8788";

if (!heliconeApiKey) {
  throw new Error("API keys must be set as environment variables.");
}

// Test cache behavior
test("customModel", async () => {
  const options: IHeliconeAsyncClientOptions = {
    heliconeMeta: {
      apiKey: heliconeApiKey,
      baseUrl: asyncURL,
    },
  };

  const logger = new HeliconeLogger(options);

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
    throw new Error(await response.text());
  }
}, 60000);
