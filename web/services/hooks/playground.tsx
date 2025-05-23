import { ChatCompletionTool } from "openai/resources";

import useRequestsPageV2 from "../../components/templates/requests/useRequestsPageV2";
import { getTimeIntervalAgo } from "@/lib/timeCalculations/time";
import { useMemo } from "react";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { Message } from "@helicone-package/llm-mapper/types";

export const getChat = (
  requests: MappedLLMRequest[]
): {
  chat: Message[];
  isChat: boolean;
  tools?: ChatCompletionTool[];
} => {
  let isChat = false;
  if (!requests || requests.length < 1) {
    return {
      chat: [],
      isChat: false,
    };
  }

  const singleRequest = requests[0];

  const getSourceChat = () => {
    if (singleRequest.heliconeMetadata.provider === "ANTHROPIC") {
      const requestBody = JSON.parse(JSON.stringify(singleRequest.raw.request));
      if (requestBody && requestBody.system && requestBody.messages) {
        const systemMessage = {
          role: "system",
          content: requestBody.system,
        };
        requestBody.messages.unshift(systemMessage);
        return JSON.parse(JSON.stringify(requestBody));
      } else {
        return JSON.parse(JSON.stringify(singleRequest.raw.request));
      }
    } else {
      return JSON.parse(JSON.stringify(singleRequest.raw.request));
    }
  };

  const sourceChat = getSourceChat();

  const sourceResponse = JSON.parse(JSON.stringify(singleRequest.raw.response));

  if (!Array.isArray(sourceChat.messages)) {
    return {
      chat: [],
      isChat: false,
    };
  }

  const sourcePrompt = [...sourceChat.messages];

  if (
    singleRequest.heliconeMetadata.provider === "ANTHROPIC" &&
    sourceResponse &&
    sourceResponse.content &&
    sourceResponse.content[0] &&
    sourceResponse.content[0].text
  ) {
    sourcePrompt.push({
      role: "assistant",
      content: sourceResponse.content[0].text,
    });
  }

  if (
    sourceResponse &&
    sourceResponse.choices &&
    sourceResponse.choices[0].message &&
    sourceResponse.choices[0].message !== ""
  ) {
    sourcePrompt.push(sourceResponse.choices[0].message);
  }

  // give all the messages in sourcePrompt an id
  sourcePrompt.forEach((message: any, index: number) => {
    message.id = index;
  });

  if (sourcePrompt.length > 1) {
    isChat = true;
  }

  const enforceToolType = (tools: any[]) => {
    try {
      return tools.map((tool) => tool as ChatCompletionTool);
    } catch (e) {
      return undefined;
    }
  };

  return {
    chat: sourcePrompt,
    isChat,
    tools: enforceToolType(sourceChat.tools),
  };
};

export const usePlaygroundPage = (requestId: string) => {
  const timeFilter = useMemo(() => getTimeIntervalAgo("3m"), []);
  const requests = useRequestsPageV2(
    1,
    1,
    {
      operator: "and",
      rows: [],
    },
    {
      left: {
        request_response_rmt: {
          request_id: {
            equals: requestId,
          },
        },
      },
      operator: "and",
      right: {
        request_response_rmt: {
          request_created_at: {
            gte: timeFilter,
          },
        },
      },
    },
    {},
    false,
    false
  );

  const { chat, isChat, tools } = getChat(requests.requests);

  return {
    isLoading:
      requests.isDataLoading ||
      requests.isBodyLoading ||
      requests.isRefetching ||
      requests.isCountLoading,
    data: requests.requests,
    chat,
    refetch: requests.refetch,
    hasData: requests.requests && requests.requests.length > 0,
    isChat,
    tools,
  };
};
