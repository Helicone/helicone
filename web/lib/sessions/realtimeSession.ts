import { Message } from "@/packages/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { HeliconeRequest } from "../api/request/request";
import { Session } from "./sessionTypes";

/**
 * Checks if a session is a realtime session based on the first request's model
 */
export const isRealtimeSession = (
  session: Session,
  requests: HeliconeRequest[]
): boolean => {
  if (
    !session.traces ||
    session.traces.length === 0 ||
    !requests ||
    requests.length === 0
  ) {
    return false;
  }

  // Get the first request in the session
  const firstRequestId = session.traces[0].request_id;
  const firstRequest = requests.find(
    (req) => req.request_id === firstRequestId
  );

  if (!firstRequest) {
    return false;
  }

  const model = firstRequest.request_model || firstRequest.response_model || "";

  // Check if the model string contains "realtime"
  return model.toLowerCase().includes("realtime");
};

/**
 * Creates simulated requests from a realtime session's messages
 */
export const getRealtimeSimulatedRequests = (
  realtimeRequest: HeliconeRequest
): HeliconeRequest[] => {
  if (!realtimeRequest) {
    return [];
  }

  const mappedContent = heliconeRequestToMappedContent(realtimeRequest);

  // Get all timestamped messages from the realtime request
  const messages = mappedContent.schema.request.messages || [];
  const responseMessages = mappedContent.schema.response?.messages || [];
  const allMessages = [...messages, ...responseMessages];

  // Sort messages by timestamp
  const sortedMessages = [...allMessages].sort((a, b) => {
    return (
      new Date(a.timestamp || 0).getTime() -
      new Date(b.timestamp || 0).getTime()
    );
  });

  // Create a simulated request for each message
  return sortedMessages
    .filter((message) => message.role) // Only include messages with roles
    .map((message, index) => {
      return createSimulatedRequest(realtimeRequest, message, index);
    });
};

/**
 * Creates a simulated request from a single message
 */
function createSimulatedRequest(
  originalRequest: HeliconeRequest,
  message: Message,
  messageIndex: number
): HeliconeRequest {
  // Create an id for the simulated request based on timestamp and message index
  const timestamp = message.timestamp || originalRequest.request_created_at;
  const simulatedId = `${originalRequest.request_id}-${new Date(
    timestamp
  ).getTime()}-${messageIndex}`;

  // Determine if this is a user or assistant message
  const isUser = message.role === "user";

  // Create the simulated request object
  return {
    ...originalRequest,
    request_id: simulatedId,
    request_created_at: timestamp,
    response_created_at: timestamp,
    // Set content based on whether it's a user or assistant message
    request_body: {
      ...originalRequest.request_body,
      messages: isUser ? [] : [message],
    },
    response_body: {
      ...originalRequest.response_body,
      messages: isUser ? [message] : [],
    },
    // Add a property to identify this as a simulated realtime request
    properties: {
      ...originalRequest.properties,
      _helicone_simulated_realtime: "true",
      _helicone_realtime_role: isUser ? "user" : "assistant",
      _helicone_realtime_timestamp: timestamp,
      _helicone_realtime_message_index: messageIndex.toString(),
    },
  };
}

/**
 * Get either the original requests or simulated realtime requests
 */
export const getEffectiveRequests = (
  session: Session,
  requests: HeliconeRequest[]
): HeliconeRequest[] => {
  if (!isRealtimeSession(session, requests)) {
    return requests;
  }

  // Get the first request in the session
  const firstRequestId = session.traces[0].request_id;
  const firstRequest = requests.find(
    (req) => req.request_id === firstRequestId
  );

  if (!firstRequest) {
    return requests;
  }

  // Generate simulated requests from the realtime session
  return getRealtimeSimulatedRequests(firstRequest);
};
