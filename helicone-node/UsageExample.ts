import { Readable } from "stream";
import {
  ConfigurationParameters,
  HeliconeAsyncConfigurationManager,
  HeliconeAsyncLogger,
  HeliconeAsyncOpenAIApi,
  HeliconeAyncLogRequest,
  HeliconeProxyConfigurationManager,
  HeliconeProxyOpenAIApi,
  IHeliconeConfigurationParameters,
  Provider,
} from ".";

const openAIKey = "";
const heliconeKey = "";

async function main() {
  // Proxy part
  // await testProxyLogging();

  // Automatic Async Logging part
  // await asyncLogging();

  await asyncLoggingStream();

  // Manual Async Logging part
  // await asyncLoggingManual();

  // await asyncLoggingStreamManual();
}

const localProxy = "http://127.0.0.1:8787/v1";
const localAsync = "http://127.0.0.1:8787";

async function testProxyLogging() {
  const heliconeConfigParams: IHeliconeConfigurationParameters = {
    heliconeApiKey: process.env.HELICONE_API,
    heliconeMeta: {
      cache: true,
      retry: true,
      properties: {
        Type: "Proxy Logging",
      },
      rateLimitPolicy: {
        quota: 20,
        time_window: 60,
      },
      user: "test-user",
    },
  };
  const openAIConfigParams: ConfigurationParameters = {
    apiKey: process.env.OPENAI_API_KEY,
  };

  const configManager = new HeliconeProxyConfigurationManager(
    heliconeConfigParams,
    openAIConfigParams,
    localProxy
  );

  const openAIClient = new HeliconeProxyOpenAIApi(configManager);
  const result = await openAIClient.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Just say proxy!" }],
  });
}

async function asyncLogging() {
  const heliconeConfigParams: IHeliconeConfigurationParameters = {
    heliconeApiKey: heliconeKey,
    heliconeMeta: {
      // cache: false,
      retry: true,
      properties: {
        Type: "AsyncLogging",
      },
      rateLimitPolicy: {
        quota: 20,
        time_window: 60,
      },
      user: "test-user",
    },
  };

  const openAIConfigParams: ConfigurationParameters = { apiKey: openAIKey };
  const configManager = new HeliconeAsyncConfigurationManager(
    heliconeConfigParams,
    openAIConfigParams,
    undefined,
    async (log: any) => {}
  );

  const heliconeOpenAIApi = new HeliconeAsyncOpenAIApi(configManager);
  const result = await heliconeOpenAIApi.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Just say auto async!" }],
  });
}

async function asyncLoggingStream() {
  const heliconeConfigParams: IHeliconeConfigurationParameters = {
    heliconeApiKey: heliconeKey,
    heliconeMeta: {
      // cache: false,
      retry: true,
      properties: {
        Type: "AsyncLogging",
      },
      rateLimitPolicy: {
        quota: 20,
        time_window: 60,
      },
      user: "test-user",
    },
  };

  const openAIConfigParams: ConfigurationParameters = { apiKey: openAIKey };
  const configManager = new HeliconeAsyncConfigurationManager(
    heliconeConfigParams,
    openAIConfigParams,
    localAsync
  );

  const openAILogger = new HeliconeAsyncOpenAIApi(configManager);
  const result = await openAILogger.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "JUST SAY HI" }],
    stream: true,
  });

  if (result.data instanceof Readable) {
    result.data.on("data", (chunk: any) => {
      console.log("Proof it splits: " + chunk.toString());
    });
  }
}

async function asyncLoggingManual() {
  const heliconeConfigParams: IHeliconeConfigurationParameters = {
    heliconeApiKey: heliconeKey,
    heliconeMeta: {
      // cache: false,
      retry: true,
      properties: {
        Type: "AsyncLoggingManual",
      },
      rateLimitPolicy: {
        quota: 20,
        time_window: 60,
      },
      user: "test-user",
    },
  };

  const openAIConfigParams: ConfigurationParameters = { apiKey: openAIKey };
  const configManager = new HeliconeAsyncConfigurationManager(
    heliconeConfigParams,
    openAIConfigParams,
    localAsync
  );

  const chatCompletionRequest = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user" as any, content: "Just say manual async!" }],
  };

  const openAIClient = new HeliconeAsyncOpenAIApi(configManager);
  const startTime = Date.now();
  const result = await openAIClient.createChatCompletion(chatCompletionRequest);
  const endTime = Date.now();
  const heliconeAsyncLogger = new HeliconeAsyncLogger(configManager);

  const asyncLogModel: HeliconeAyncLogRequest = {
    providerRequest: {
      url: "https://api.openai.com/v1", // User has to set this as it can be any url
      json: chatCompletionRequest,
      meta: configManager.getHeliconeHeaders(), // Populate headers if available
    },
    providerResponse: {
      json: result.data,
      status: result.status,
      headers: result.headers,
    },
    timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
  };

  await heliconeAsyncLogger.log(asyncLogModel, Provider.OPENAI);
}

async function asyncLoggingStreamManual() {
  const heliconeConfigParams: IHeliconeConfigurationParameters = {
    heliconeApiKey: heliconeKey,
    heliconeMeta: {
      // cache: false,
      retry: true,
      properties: {
        Type: "AsyncLoggingManual",
      },
      rateLimitPolicy: {
        quota: 20,
        time_window: 60,
      },
      user: "test-user",
    },
  };

  const openAIConfigParams: ConfigurationParameters = { apiKey: openAIKey };
  const configManager = new HeliconeAsyncConfigurationManager(
    heliconeConfigParams,
    openAIConfigParams,
    localAsync
  );

  const chatCompletionRequest = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user" as any, content: "Just say manual async!" }],
    stream: true,
  };

  const openAIClient = new HeliconeAsyncOpenAIApi(configManager);
  const startTime = Date.now();
  const result = await openAIClient.createChatCompletion(
    chatCompletionRequest,
    { responseType: "stream" }
  );
  if (!("on" in result.data)) throw new Error("No data received from OpenAI");
  if (!(result.data instanceof Readable))
    throw new Error("response data does not have Readable.on stream method");
  result.data.on("data", (chunk: Buffer) => {
    console.log(chunk.toString());
  });
  const endTime = Date.now();
  const heliconeAsyncLogger = new HeliconeAsyncLogger(configManager);

  const asyncLogModel: HeliconeAyncLogRequest = {
    providerRequest: {
      url: "https://api.openai.com/v1", // User has to set this as it can be any url
      json: chatCompletionRequest,
      meta: configManager.getHeliconeHeaders(), // Populate headers if available
    },
    providerResponse: {
      json: result.data,
      status: result.status,
      headers: result.headers,
    },
    timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
  };

  await heliconeAsyncLogger.log(asyncLogModel, Provider.OPENAI);
}

main()
  .then(() => {
    console.log("Main function executed successfully.");
  })
  .catch((error) => {
    console.error("An error occurred: " + error);
  });
