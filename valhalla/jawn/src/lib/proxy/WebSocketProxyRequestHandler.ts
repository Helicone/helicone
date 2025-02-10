import crypto from "crypto";
import { Headers, Response } from "node-fetch";
import { SocketMessage } from "../../types/realtime";
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

  const responseHeaders = new Headers();
  responseHeaders.set("Helicone-Status", "success");
  responseHeaders.set("Helicone-Id", requestId);

  const clientMessages = messages.filter((msg) => msg.from === "client");
  const targetMessages = messages.filter((msg) => msg.from === "target");

  const startingSession = targetMessages[0]?.content?.session;

  const requestBody = {
    model: startingSession.model,
    temperature: startingSession.temperature,
    modalities: startingSession.modalities,
    instructions: startingSession.instructions,
    voice: startingSession.voice,
    turn_detection: startingSession.turn_detection,
    input_audio_format: startingSession.input_audio_format,
    output_audio_format: startingSession.output_audio_format,
    tool_choice: startingSession.tool_choice,
    max_response_output_tokens: startingSession.max_response_output_tokens,
    tools: startingSession.tools,

    messages: clientMessages,
  };

  const responseBody = {
    id: startingSession.id,
    object: startingSession.object,
    usage: {
      // TODO: infer from all response.done messages
      total_tokens: 0,
      input_tokens: 0,
      output_tokens: 0,
      input_token_details: {},
      output_token_details: {},
    },

    messages: targetMessages,
  };

  return {
    loggable: new DBLoggable({
      request: {
        requestId,
        provider: "OPENAI",
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
        bodyText: JSON.stringify(requestBody),
      },
      response: {
        responseId,
        getResponseBody: async () => ({
          body: JSON.stringify(responseBody),
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
