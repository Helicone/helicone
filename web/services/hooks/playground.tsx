import { Message } from "../../components/templates/requests/chat";
import { NormalizedRequest } from "../../components/templates/requestsV2/builder/abstractRequestBuilder";
import useRequestsPageV2 from "../../components/templates/requestsV2/useRequestsPageV2";

export const getChat = (
  requests: NormalizedRequest[]
): {
  chat: Message[];
  isChat: boolean;
} => {
  let isChat = false;
  if (!requests || requests.length < 1) {
    return {
      chat: [],
      isChat: false,
    };
  }

  const sourceChat = JSON.parse(JSON.stringify(requests[0].requestBody));

  const sourceResponse = JSON.parse(JSON.stringify(requests[0].responseBody));

  if (!Array.isArray(sourceChat.messages)) {
    return {
      chat: [],
      isChat: false,
    };
  }

  const sourcePrompt = [...sourceChat.messages];

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

  return {
    chat: sourcePrompt,
    isChat,
  };
};

export const usePlaygroundPage = (requestId: string) => {
  const requests = useRequestsPageV2(
    1,
    1,
    [],
    {
      request: {
        id: {
          equals: requestId,
        },
      },
    },
    {},
    false,
    false
  );

  const { chat, isChat } = getChat(requests.requests);

  return {
    isLoading: requests.isDataLoading,
    data: requests.requests,
    chat,
    refetch: requests.refetch,
    hasData: requests.requests && requests.requests.length > 0,
    isChat,
  };
};
