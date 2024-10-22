import { ChatCompletionTool } from "openai/resources";
import { Message } from "../../components/templates/requests/chatComponent/types";
import { NormalizedRequest } from "../../components/templates/requestsV2/builder/abstractRequestBuilder";
import useRequestsPageV2 from "../../components/templates/requestsV2/useRequestsPageV2";
import { getTimeIntervalAgo } from "@/lib/timeCalculations/time";
import { useMemo } from "react";

export const getChat = (
  requests: NormalizedRequest[]
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
    if (singleRequest.provider === "ANTHROPIC") {
      const requestBody = JSON.parse(JSON.stringify(singleRequest.requestBody));
      if (requestBody && requestBody.system && requestBody.messages) {
        const systemMessage = {
          role: "system",
          content: requestBody.system,
        };
        requestBody.messages.unshift(systemMessage);
        return JSON.parse(JSON.stringify(requestBody));
      } else {
        return JSON.parse(JSON.stringify(singleRequest.requestBody));
      }
    } else {
      return JSON.parse(JSON.stringify(singleRequest.requestBody));
    }
  };

  const sourceChat = getSourceChat();

  const sourceResponse = JSON.parse(JSON.stringify(requests[0].responseBody));

  if (!Array.isArray(sourceChat.messages)) {
    return {
      chat: [],
      isChat: false,
    };
  }

  const sourcePrompt = [...sourceChat.messages];

  if (
    singleRequest.provider === "ANTHROPIC" &&
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

  const { chat, isChat, tools } = getChat(requests.normalizedRequests);

  return {
    isLoading:
      requests.isDataLoading ||
      requests.isBodyLoading ||
      requests.isRefetching ||
      requests.isCountLoading,
    data: requests.normalizedRequests,
    chat,
    refetch: requests.refetch,
    hasData:
      requests.normalizedRequests && requests.normalizedRequests.length > 0,
    isChat,
    tools,
  };
};
