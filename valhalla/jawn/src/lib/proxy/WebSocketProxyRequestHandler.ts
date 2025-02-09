import crypto from "crypto";
import { Headers, Response } from "node-fetch";
import {
  realtimeToChatMessages,
  SocketMessage,
  socketToRealtimeMessages,
} from "../../types/realtime";
import { RequestWrapper } from "../requestWrapper/requestWrapper";
import { DBLoggable } from "./DBLoggable";

export async function handleSocketSession(
  messages: SocketMessage[],
  requestWrapper: RequestWrapper
): Promise<{
  loggable: DBLoggable;
  response: Response;
}> {
  const requestId = crypto.randomUUID();
  const responseId = crypto.randomUUID();
  const startTime = new Date(
    messages[0]?.timestamp ?? new Date().toISOString()
  );
  const endTime = new Date(
    messages[messages.length - 1]?.timestamp ?? new Date().toISOString()
  );

  // Convert raw messages to RealtimeMessage format
  const realtimeMessages = socketToRealtimeMessages(messages);

  // Convert RealtimeMessage format to OpenAI chat format
  const openaiChatMessages = realtimeToChatMessages(realtimeMessages);

  const responseHeaders = new Headers();
  responseHeaders.set("Helicone-Status", "success");
  responseHeaders.set("Helicone-Id", requestId);

  return {
    loggable: new DBLoggable({
      request: {
        requestId,
        provider: "OPENAI",
        modelOverride: "gpt-4o-realtime-preview-2024-12-17",
        promptSettings: { promptId: undefined, promptMode: "deactivated" },
        startTime,
        path: requestWrapper.url.pathname,
        heliconeProxyKeyId: requestWrapper.heliconeProxyKeyId,
        isStream: true,
        targetUrl: requestWrapper.url.toString(),
        properties: {},
        omitLog: false,
        nodeId: null,
        threat: null,
        flaggedForModeration: null,
        request_ip: null,
        country_code: null,
        experimentColumnId: null,
        experimentRowIndex: null,
        bodyText: JSON.stringify(openaiChatMessages), // JSON.stringify(messages), // Store original messages for reference
      },
      response: {
        responseId,
        getResponseBody: async () => ({
          body: JSON.stringify(openaiChatMessages), // Store converted messages
          endTime,
        }),
        status: async () => 200,
        responseHeaders,
        omitLog: requestWrapper.heliconeHeaders.omitHeaders.omitResponse,
      },
      timing: {
        startTime,
        endTime,
        timeToFirstToken: async () => null,
      },
      tokenCalcUrl: "",
    }),
    response: new Response("", {
      headers: responseHeaders,
      status: 200,
    }),
  };
}
