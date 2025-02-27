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

  // First, identify all conversation turns (to get consistent turn indexing)
  const turns: Message[][] = [];
  let currentTurn: Message[] = [];
  let currentRole = "";

  sortedMessages.forEach((message) => {
    // Skip messages without roles completely (they won't form turns)
    if (!message.role) return;

    // If role changes or this is the first message, start a new turn
    if (
      currentRole !== message.role ||
      currentRole === "" ||
      turns.length === 0
    ) {
      if (currentTurn.length > 0) {
        turns.push(currentTurn);
      }
      currentTurn = [message];
      currentRole = message.role;
    } else {
      // Continue current turn
      currentTurn.push(message);
    }
  });

  // Add the last turn
  if (currentTurn.length > 0) {
    turns.push(currentTurn);
  }

  // Now create simulated requests based on these turns
  const simulatedRequests: HeliconeRequest[] = [];

  turns.forEach((turnMessages, turnIndex) => {
    // Create a simulated request for each turn
    // Include all previous messages as context
    const previousMessages =
      turnIndex > 0
        ? sortedMessages.slice(0, sortedMessages.indexOf(turnMessages[0]))
        : [];

    simulatedRequests.push(
      createSimulatedRequest(
        realtimeRequest,
        turnMessages,
        previousMessages,
        turnIndex // Use the sequential turn index
      )
    );
  });

  return simulatedRequests;
};

/**
 * Creates a simulated request from a collection of messages in the same turn
 */
function createSimulatedRequest(
  originalRequest: HeliconeRequest,
  turnMessages: Message[],
  previousMessages: Message[],
  turnIndex: number
): HeliconeRequest {
  // Create an id for the simulated request based on timestamp and turn index
  const timestamp =
    turnMessages[0].timestamp || originalRequest.request_created_at;
  const simulatedId = `${originalRequest.request_id}-${new Date(
    timestamp
  ).getTime()}-${turnIndex}`;

  // Determine if this is a user or assistant message
  const isUser = turnMessages[0].role === "user";

  // Create the simulated request object
  return {
    ...originalRequest,
    request_id: simulatedId,
    request_created_at: timestamp,
    response_created_at: timestamp,
    // Set content based on whether it's a user or assistant message
    request_body: {
      ...originalRequest.request_body,
      messages: isUser ? [] : previousMessages,
    },
    response_body: {
      ...originalRequest.response_body,
      messages: isUser ? turnMessages : [],
    },
    // Add a property to identify this as a simulated realtime request
    properties: {
      ...originalRequest.properties,
      _helicone_simulated_realtime: "true",
      _helicone_realtime_role: isUser ? "user" : "assistant",
      _helicone_realtime_timestamp: timestamp,
      _helicone_realtime_turn_index: turnIndex.toString(),
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
