import {
  MappedLLMRequest,
  Message,
  MapperType,
} from "@/packages/llm-mapper/types";
import { SingleFilterDef } from "@/services/lib/filters/frontendFilterDefs";

export const getMockRequests = (): MappedLLMRequest[] => {
  // Generate 10 realistic looking LLM requests
  return [...Array(10)].map((_, i) => {
    const userMessage: Message = {
      _type: "message",
      role: "user",
      content:
        i % 2 === 0
          ? "Explain how to implement a binary search tree"
          : "What are the best practices for React performance optimization?",
    };

    const assistantMessage: Message = {
      _type: "message",
      role: "assistant",
      content:
        i % 2 === 0
          ? "A binary search tree (BST) is a data structure that allows for efficient lookup, insertion, and deletion operations. Each node in a BST has at most two children, with all nodes in the left subtree having values less than the node's value, and all nodes in the right subtree having values greater than the node's value..."
          : "To optimize React performance, you should: 1) Use React.memo for component memoization, 2) Implement useMemo and useCallback hooks for expensive calculations and function references, 3) Use proper key props for lists, 4) Avoid unnecessary re-renders through state management optimization...",
    };

    const model = i % 2 === 0 ? "gpt-4" : "gpt-3.5-turbo";

    return {
      _type: "openai-chat" as MapperType,
      id: `mock-req-${i}`,
      model: model,
      schema: {
        request: {
          model: model,
          messages: [userMessage],
          stream: false,
        },
        response: {
          messages: [assistantMessage],
          model: model,
        },
      },
      preview: {
        request: userMessage.content || "",
        response: assistantMessage.content || "",
        concatenatedMessages: [userMessage, assistantMessage],
      },
      content: {
        request: {
          messages: [userMessage],
        },
        response: {
          choices: [
            {
              message: assistantMessage,
            },
          ],
        },
      },
      raw: {
        request: {
          model: model,
          stream: false,
        },
        response: {
          usage: {
            prompt_tokens: 200 + i * 50,
            completion_tokens: 150 + i * 25,
            total_tokens: 350 + i * 75,
          },
        },
      },
      heliconeMetadata: {
        requestId: `mock-req-${i}`,
        userId: `user-${i % 3}`,
        path: "/v1/chat/completions",
        countryCode: "US",
        createdAt: new Date(Date.now() - i * 1000 * 60 * 5).toISOString(), // Spaced 5 minutes apart
        totalTokens: 350 + i * 75,
        promptTokens: 200 + i * 50,
        completionTokens: 150 + i * 25,
        latency: 2000 + i * 500,
        user: `user-${i % 3}`,
        status: {
          code: 200,
          statusType: "success",
        },
        customProperties: {
          "request-type": i % 3 === 0 ? "chat" : "completion",
          "app-version": `1.${i % 9}`,
          client: i % 4 === 0 ? "web" : i % 4 === 1 ? "mobile" : "api",
        },
        cost: 0.02 + i * 0.005,
        feedback: {
          createdAt: null,
          id: null,
          rating: null,
        },
        provider: "OPENAI",
        timeToFirstToken: 500 + i * 100,
        modelInfo: {
          model: model,
        },
      },
    };
  });
};

export const getMockProperties = () => {
  return ["request-type", "app-version", "client"];
};

export const getMockFilterMap = () => {
  // Return a simplified version of the filter map that matches the SingleFilterDef type
  return [
    {
      label: "Model",
      operators: [
        { label: "equals", value: "=" },
        { label: "not equals", value: "!=" },
      ],
      table: "request_response_rmt",
      column: "model",
      category: "request",
    },
    {
      label: "User",
      operators: [
        { label: "equals", value: "=" },
        { label: "not equals", value: "!=" },
      ],
      table: "request_response_rmt",
      column: "user_id",
      category: "request",
    },
    {
      label: "Status",
      operators: [
        { label: "equals", value: "=" },
        { label: "not equals", value: "!=" },
      ],
      table: "request_response_rmt",
      column: "status",
      category: "request",
    },
    {
      label: "Request Type",
      operators: [
        { label: "equals", value: "=" },
        { label: "not equals", value: "!=" },
      ],
      table: "properties",
      column: "request-type",
      category: "custom properties",
      isCustomProperty: true,
    },
    {
      label: "App Version",
      operators: [
        { label: "equals", value: "=" },
        { label: "not equals", value: "!=" },
      ],
      table: "properties",
      column: "app-version",
      category: "custom properties",
      isCustomProperty: true,
    },
  ] as SingleFilterDef<any>[];
};
