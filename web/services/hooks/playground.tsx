import { getUSDate } from "../../components/shared/utils/utils";
import { Message } from "../../components/templates/requests/requestsPage";
import useRequestsPage, {
  PromptResponsePair,
} from "../../components/templates/requests/useRequestsPage";
import { Json } from "../../supabase/database.types";

export const usePlaygroundPage = (requestId: string) => {
  const request = useRequestsPage(
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
    {}
  );

  const dataWithLabels = [
    {
      label: "Created At",
      value:
        request.requests.data && request.requests.data.length > 0
          ? getUSDate(request.requests.data[0].requestCreatedAt)
          : "",
    },
    {
      label: "User ID",
      value:
        request.requests.data && request.requests.data.length > 0
          ? request.requests.data[0].userId
          : "",
    },
    {
      label: "Duration",
      value:
        request.requests.data && request.requests.data.length > 0
          ? `${request.requests.data[0].latency}s`
          : "",
    },
    {
      label: "Model",
      value:
        request.requests.data && request.requests.data.length > 0
          ? request.requests.data[0].model
          : "",
    },
    {
      label: "Tokens",
      value:
        request.requests.data && request.requests.data.length > 0
          ? request.requests.data[0].totalTokens
          : "",
    },
    {
      label: "Log Probability",
      value:
        request.requests.data && request.requests.data.length > 0
          ? request.requests.data[0].logProbs
          : "",
    },
  ];

  const properties = request.properties;

  properties.forEach((property) => {
    dataWithLabels.push({
      label: property,
      value:
        request.requests.data && request.requests.data.length > 0
          ? (request.requests.data[0][property] as string)
          : "",
    });
  });

  // Get the chat from the request
  const sourceChat =
    request.requests.data &&
    request.requests.data.length > 0 &&
    request.requests.data[0].api &&
    "chat" in request.requests.data[0].api
      ? request.requests.data[0].api.chat.request
      : [];

  const sourceResponse =
    request.requests.data &&
    request.requests.data.length > 0 &&
    request.requests.data[0].api &&
    "chat" in request.requests.data[0].api
      ? request.requests.data[0].api.chat.response
      : "";

  const chat =
    sourceChat && sourceResponse ? [...sourceChat, sourceResponse] : [];

  return {
    isLoading: request.requests.isLoading,
    data: dataWithLabels,
    chat,
    hasData: request.requests.data && request.requests.data.length > 0,
    isChat:
      (request.requests.data &&
        request.requests.data.length > 0 &&
        "chat" in request.requests.data[0].api) ||
      false,
  };
};
