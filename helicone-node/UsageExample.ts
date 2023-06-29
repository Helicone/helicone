import { HeliconeProxyConfiguration } from "./core/HeliconeProxyConfiguration";
import { CreateChatCompletionRequest, OpenAIApi } from "openai";
import { OpenAILogger } from "./providers/openai/OpenAILogger";
import { HeliconeAsyncLogger, HeliconeAyncLogRequest, Provider } from "./core/HeliconeAsyncLogger";
import { HeliconeAsyncConfiguration } from "./core/HeliconeAsyncConfiguration";

async function main() {
  // Create configuration for async logging
  const asyncConfiguration = new HeliconeAsyncConfiguration({
    apiKey: "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",
    heliconeApiKey: "sk-hohqzcy-gi5ey2i-vzl422q-p6iialy",
    properties: {
      "Type": "Course"
    },
    user: "User1"
  });

  asyncConfiguration.setHeliconeBaseUrl("http://127.0.0.1:54455");

  const chatCompletionRequest1: CreateChatCompletionRequest = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Just say hi!" }]
  };

  // Log automatically through wrapper
  const openAILogger = new OpenAILogger(asyncConfiguration);
  console.log("Logging async automatically #########################################################################################################");
  const result = await openAILogger.createChatCompletion(chatCompletionRequest1);
  
  // Or log manually
  const openAIClient = new OpenAIApi(asyncConfiguration);

  const chatCompletionRequest2: CreateChatCompletionRequest = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Say poo" }]
  };

  const startTime = Date.now();
  const result2 = await openAIClient.createChatCompletion(chatCompletionRequest2);
  const endTime = Date.now();

  const asyncLogModel: HeliconeAyncLogRequest = {
    providerRequest: {
      url: "https://api.openai.com/v1", // User has to set this as it can be any url
      json: chatCompletionRequest2,
      meta: asyncConfiguration.getHeliconeHeaders(), // Populate headers if available
    },
    providerResponse: {
      json: result2.data,
      status: result2.status,
      headers: result2.headers,
    },
    timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
  };

  const heliconeLogger = new HeliconeAsyncLogger(asyncConfiguration);
  console.log("Logging async manually #########################################################################################################");
  await heliconeLogger.log(asyncLogModel, Provider.OPENAI);

  // Create configuration for proxy loging
  const proxyConfiguration = new HeliconeProxyConfiguration({
    apiKey: "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",
    heliconeApiKey: "sk-hohqzcy-gi5ey2i-vzl422q-p6iialy",
    cache: false,
    retry: true,
    properties: {},
    rateLimitPolicy: {},
  });

  proxyConfiguration.basePath = "http://127.0.0.1:54455";

  const openAIClient2 = new OpenAIApi(proxyConfiguration);
  console.log("Logging proxy #########################################################################################################");
  const result3 = await openAIClient.createChatCompletion(chatCompletionRequest1);
}

main()
  .then(() => {
    console.log("Main function executed successfully.");
  })
  .catch((error) => {
    console.error("An error occurred:", error);
  });
