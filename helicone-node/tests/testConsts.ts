import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

const TEST_HELICONE_API_KEY = "sk-helicone-12345-12345-12345-12345";
const TEST_OPENAI_API_KEY = "sk-openai-12345-12345-12345-12345";
const TEST_OPENAI_ORG = "org-12345-12345-12345-12345";
const TEST_ASYNC_URL = "http://127.0.0.1:8788";
const TEST_PROXY_URL = "http://127.0.0.1:8788/v1";
const TEST_OPENAI_URL = "https://api.openai.com";
const TEST_TELEMETRY_URL = "http://127.0.0.1:3000";

const completionRequestBody = {
  model: "text-ada-001",
  prompt: "Test",
  max_tokens: 10,
};

const completionResponseBody = {
  id: "cmpl-uqkvlQyYK7bGYrRHQ0eXlWi7",
  object: "text_completion",
  created: 1589478378,
  model: "text-ada-001",
  choices: [
    {
      text: "This is a test",
      index: 0,
      logprobs: [] as any,
      finish_reason: "length",
    },
  ],
  usage: {
    prompt_tokens: 5,
    completion_tokens: 5,
    total_tokens: 10,
  },
};

const chatCompletionRequestBody: ChatCompletionCreateParamsNonStreaming = {
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: "You are a helpful assistant.",
    },
    {
      role: "user",
      content: "Hello!",
    },
  ] as ChatCompletionMessageParam[],
};

const chatCompletionResponseBody = {
  id: "chatcmpl-123",
  object: "chat.completion",
  created: 1677652288,
  model: "gpt-3.5-turbo-0613",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "Hello there, how may I assist you today?",
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 9,
    completion_tokens: 12,
    total_tokens: 21,
  },
};

const completionAsyncLogModel = {
  providerRequest: {
    url: "https://api.openai.com/v1",
    json: { model: "text-ada-001", prompt: "Test", max_tokens: 10 },
    meta: {
      "Helicone-Auth": `Bearer ${TEST_HELICONE_API_KEY}`,
      "Helicone-Property-example": "propertyValue",
      "Helicone-User-Id": "test-user",
    },
  },
  providerResponse: {
    json: {
      id: "cmpl-uqkvlQyYK7bGYrRHQ0eXlWi7",
      object: "text_completion",
      created: 1589478378,
      model: "text-ada-001",
      choices: [
        {
          text: "This is a test",
          index: 0,
          logprobs: [] as any[],
          finish_reason: "length",
        },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
    },
    status: 200,
    headers: { "content-type": "application/json" },
  },
};

const chatCompletionAsyncModel = {
  providerRequest: {
    url: "https://api.openai.com/v1",
    json: {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello!" },
      ],
    },
    meta: {
      "Helicone-Auth": `Bearer ${TEST_HELICONE_API_KEY}`,
      "Helicone-Property-example": "propertyValue",
      "Helicone-User-Id": "test-user",
    },
  },
  providerResponse: {
    json: {
      id: "chatcmpl-123",
      object: "chat.completion",
      created: 1677652288,
      model: "gpt-3.5-turbo-0613",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "Hello there, how may I assist you today?",
          },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 9, completion_tokens: 12, total_tokens: 21 },
    },
    status: 200,
    headers: { "content-type": "application/json" },
  },
};

const createCustomModelRequestBody = (requestId: string) => ({
  providerRequest: {
    json: { model: "llama-2", prompt: "Say hi!" },
    url: "",
    meta: {
      "Helicone-Request-Id": requestId,
      "Helicone-User-Id": "test-user",
    },
  },
  providerResponse: {
    json: {
      text: "This is my response",
      usage: { total_tokens: 13, prompt_tokens: 5, completion_tokens: 8 },
      model: "llama-2",
    },
    status: 200,
    headers: {},
  },
});

const telemetryHttpRequestBody = {
  resourceSpans: [
    {
      scopeSpans: [
        {
          name: "openai.chat",
          kind: 3,
          attributes: [
            {
              key: "gen_ai.system",
              value: { stringValue: "OpenAI" },
            },
            {
              key: "llm.request.type",
              value: { stringValue: "chat" },
            },
            {
              key: "gen_ai.request.model",
              value: { stringValue: "gpt-3.5-turbo" },
            },
            {
              key: "gen_ai.prompt.0.role",
              value: { stringValue: "system" },
            },
            {
              key: "gen_ai.prompt.0.content",
              value: { stringValue: "You are a helpful assistant." },
            },
            {
              key: "gen_ai.prompt.1.role",
              value: { stringValue: "user" },
            },
            {
              key: "gen_ai.prompt.1.content",
              value: { stringValue: "Hello!" },
            },
            {
              key: "gen_ai.response.model",
              value: { stringValue: "gpt-3.5-turbo-0613" },
            },
            {
              key: "llm.usage.total_tokens",
              value: { intValue: 21 },
            },
            {
              key: "gen_ai.usage.completion_tokens",
              value: { intValue: 12 },
            },
            {
              key: "gen_ai.usage.prompt_tokens",
              value: { intValue: 9 },
            },
            {
              key: "gen_ai.completion.0.finish_reason",
              value: { stringValue: "stop" },
            },
            {
              key: "gen_ai.completion.0.role",
              value: { stringValue: "assistant" },
            },
            {
              key: "gen_ai.completion.0.content",
              value: {
                stringValue: "Hello there, how may I assist you today?",
              },
            },
          ],
          droppedAttributesCount: 0,
          events: [] as unknown[],
          droppedEventsCount: 0,
          status: { code: 0 },
          links: [] as unknown[],
          droppedLinksCount: 0,
        },
      ],
    },
  ],
};

export {
  TEST_HELICONE_API_KEY,
  TEST_OPENAI_API_KEY,
  TEST_OPENAI_ORG,
  TEST_ASYNC_URL,
  TEST_PROXY_URL,
  TEST_OPENAI_URL,
  TEST_TELEMETRY_URL,
  completionRequestBody,
  completionResponseBody,
  chatCompletionRequestBody,
  telemetryHttpRequestBody,
  chatCompletionResponseBody,
  completionAsyncLogModel,
  chatCompletionAsyncModel,
  createCustomModelRequestBody,
};
