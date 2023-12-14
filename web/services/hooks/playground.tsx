import useRequestsPageV2 from "../../components/templates/requestsV2/useRequestsPageV2";
/**
 * Custom hook for the playground page.
 * Retrieves requests data and processes it to generate chat messages.
 * @param requestId - The ID of the request to retrieve.
 * @returns An object containing the following properties:
 *   - isLoading: A boolean indicating if the data is currently being loaded.
 *   - data: An array of request data.
 *   - chat: An array of chat messages.
 *   - refetch: A function to manually trigger data refetch.
 *   - hasData: A boolean indicating if there is data available.
 *   - isChat: A boolean indicating if the chat has multiple messages.
 */
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

  let isChat = false;

  const getChat = () => {
    if (!requests.requests || requests.requests.length < 1) {
      return [];
    }

    const sourceChat = JSON.parse(
      JSON.stringify(requests.requests[0].requestBody)
    );

    const sourceResponse = JSON.parse(
      JSON.stringify(requests.requests[0].responseBody)
    );

    if (!Array.isArray(sourceChat.messages)) {
      return [];
    }

    const sourcePrompt = [
      ...sourceChat.messages,
      sourceResponse.choices[0].message,
    ];

    // give all the messages in sourcePrompt an id
    sourcePrompt.forEach((message: any, index: number) => {
      message.id = index;
    });

    if (sourcePrompt.length > 1) {
      isChat = true;
    }

    return sourcePrompt;
  };

  const chat = getChat();

  return {
    isLoading: requests.isDataLoading,
    data: requests.requests,
    chat,
    refetch: requests.refetch,
    hasData: requests.requests && requests.requests.length > 0,
    isChat,
  };
};
