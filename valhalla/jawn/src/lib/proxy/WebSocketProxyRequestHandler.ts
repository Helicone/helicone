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
    usage: calculateTokenUsage(targetMessages),

    messages: targetMessages,
  };

  return {
    loggable: new DBLoggable({
      request: {
        requestId,
        userId: requestWrapper.heliconeHeaders.userId ?? undefined,
        provider: "OPENAI",
        promptSettings: { promptId: undefined, promptMode: "deactivated" },
        startTime,
        path: requestWrapper.url.pathname,
        heliconeProxyKeyId: requestWrapper.heliconeProxyKeyId,
        isStream: true,
        targetUrl: requestWrapper.url.toString(),
        properties: requestWrapper.heliconeHeaders.heliconeProperties,
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

/**
 * Calculates the total token usage from all "response.done" messages in a WebSocket session.
 * Aggregates token counts across multiple messages, including text and audio modalities.
 *
 * @param messages - Array of SocketMessages from the WebSocket session
 * @returns An object containing:
 *   - promptTokens: Sum of all input/prompt tokens
 *   - completionTokens: Sum of all output/completion tokens
 *   - totalTokens: Sum of all tokens used
 *   - promptTokenDetails: Detailed breakdown of prompt tokens (text, audio)
 *   - completionTokenDetails: Detailed breakdown of completion tokens (text, audio)
 */
function calculateTokenUsage(messages: SocketMessage[]) {
  const doneMessages = messages.filter(
    (msg) => msg.from === "target" && msg.content?.type === "response.done"
  );

  return doneMessages.reduce(
    (acc, msg) => {
      const usage = msg.content?.response?.usage;
      if (!usage) return acc;

      return {
        promptTokens: (acc.promptTokens || 0) + (usage.input_tokens || 0),
        completionTokens:
          (acc.completionTokens || 0) + (usage.output_tokens || 0),
        totalTokens: (acc.totalTokens || 0) + (usage.total_tokens || 0),
        promptTokenDetails: {
          textTokens:
            (acc.promptTokenDetails?.textTokens || 0) +
            (usage.input_token_details?.text_tokens || 0),
          audioTokens:
            (acc.promptTokenDetails?.audioTokens || 0) +
            (usage.input_token_details?.audio_tokens || 0),
        },
        completionTokenDetails: {
          textTokens:
            (acc.completionTokenDetails?.textTokens || 0) +
            (usage.output_token_details?.text_tokens || 0),
          audioTokens:
            (acc.completionTokenDetails?.audioTokens || 0) +
            (usage.output_token_details?.audio_tokens || 0),
        },
      };
    },
    {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      promptTokenDetails: {
        textTokens: 0,
        audioTokens: 0,
      },
      completionTokenDetails: {
        textTokens: 0,
        audioTokens: 0,
      },
    }
  );
}
