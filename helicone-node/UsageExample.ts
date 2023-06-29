import { HeliconeProxyConfiguration } from './core/HeliconeProxyConfiguration';
import { CreateChatCompletionRequest, OpenAIApi } from 'openai';
import { OpenAILogger } from "./providers/openai/OpenAILogger";
import { HeliconeAsyncLogger, HeliconeAyncLogRequest, Provider } from './core/HeliconeAsyncLogger';
import { HeliconeAsyncConfiguration } from './core/HeliconeAsyncConfiguration';

async function main() {
  // Create configuration for async logging
  const asyncConfiguration = new HeliconeAsyncConfiguration({
    apiKey: "apiKey",
    heliconeApiKey: "heliconeApiKey",
    cache: true,
    retry: true,
    properties: {
      Session: "24",
      Conversation: "support_issue_2",
    },
    rateLimitPolicy: {
      quota: 10,
      time_window: 60,
      segment: "Session",
    }
  });

  // Log automatically through wrapper
  const openAILogger = new OpenAILogger(asyncConfiguration);
  const result = await openAILogger.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [],
    stream: true
  });

  // Or log manually
  const openAIClient = new OpenAIApi(asyncConfiguration);
  const chatCompletionRequest: CreateChatCompletionRequest = {
    model: "gpt-3.5-turbo",
    messages: [],
  };
  const startTime = Date.now();
  const result2 = await openAIClient.createChatCompletion(chatCompletionRequest);
  const endTime = Date.now();

  const asyncLogModel: HeliconeAyncLogRequest = {
    providerRequest: {
      url: this.configuration?.basePath,
      json: chatCompletionRequest,
      meta: this.heliconeConfiguration.getHeliconeHeaders(), // Populate headers if available
    },
    providerResponse: {
      json: result2.data,
      status: result2.status,
      headers: result2.headers,
    },
    timing: HeliconeAsyncLogger.createTiming(startTime, endTime)
  };

  const heliconeLogger = new HeliconeAsyncLogger(asyncConfiguration);
  heliconeLogger.log(asyncLogModel, Provider.OPENAI);

  // Create configuration for proxy loging
  const proxyConfiguration = new HeliconeProxyConfiguration({
    apiKey: "apiKey",
    heliconeApiKey: "heliconeApiKey",
    cache: true,
    retry: true,
    properties: {
      Session: "24",
      Conversation: "support_issue_2",
    },
    rateLimitPolicy: {
      quota: 10,
      time_window: 60,
      segment: "Session",
    }
  });

  const openAIClient2 = new OpenAIApi(proxyConfiguration);
  const result3 = await openAIClient.createChatCompletion(chatCompletionRequest);
}
