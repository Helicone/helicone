import {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";

const TEST_HELICONE_API_KEY = "sk-helicone-12345-12345-12345-12345";
const TEST_OPENAI_API_KEY = "sk-openai-12345-12345-12345-12345";
const TEST_OPENAI_ORG = "org-12345-12345-12345-12345";
const TEST_ASYNC_URL = "http://127.0.0.1:8788";
const TEST_PROXY_URL = "http://127.0.0.1:8788/v1";

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

export {
  TEST_HELICONE_API_KEY,
  TEST_OPENAI_API_KEY,
  TEST_OPENAI_ORG,
  TEST_ASYNC_URL,
  TEST_PROXY_URL,
  completionRequestBody,
  completionResponseBody,
  chatCompletionRequestBody,
  chatCompletionResponseBody,
  completionAsyncLogModel,
  chatCompletionAsyncModel,
  createCustomModelRequestBody,
};
