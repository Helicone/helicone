import { MapperBuilder } from "../../path-mapper/builder";
import { FunctionCall, LlmSchema, Message } from "../../types";

/**
 * Simplified interface for the Google (Gemini) Chat request format
 */
interface GoogleChatRequest {
  model?: string;
  contents?:
    | Array<{
        role?: string;
        parts?:
          | Array<{
              text?: string;
              inlineData?: {
                data?: string;
              };
              functionCall?: {
                name: string;
                args: Record<string, any>;
              };
            }>
          | {
              text?: string;
              inlineData?: {
                data?: string;
              };
              functionCall?: {
                name: string;
                args: Record<string, any>;
              };
            };
      }>
    | {
        role?: string;
        parts?:
          | Array<{
              text?: string;
              inlineData?: {
                data?: string;
              };
              functionCall?: {
                name: string;
                args: Record<string, any>;
              };
            }>
          | {
              text?: string;
              inlineData?: {
                data?: string;
              };
              functionCall?: {
                name: string;
                args: Record<string, any>;
              };
            };
      };
  generationConfig?: {
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    candidateCount?: number;
    stopSequences?: string[];
  };
}

/**
 * Extract text from the request
 */
const getRequestText = (requestBody: GoogleChatRequest): string => {
  try {
    if (!requestBody || !requestBody.contents) return "";

    const contents = requestBody.contents;
    const messages = Array.isArray(contents)
      ? contents
      : [contents].filter(Boolean);

    if (messages.length === 0) return "";

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || !lastMessage.parts) return "";

    const parts = Array.isArray(lastMessage.parts)
      ? lastMessage.parts
      : [lastMessage.parts].filter(Boolean);

    if (parts.length === 0) return "";

    const textParts = parts.filter(
      (part: any) => part && typeof part.text === "string"
    );

    return textParts.map((part: any) => part.text).join(" ");
  } catch (error) {
    console.error("Error parsing request text:", error);
    return "error_parsing_request";
  }
};

/**
 * Extract text from the response
 */
const getResponseText = (
  responseBody: any,
  statusCode: number = 200
): string => {
  try {
    if (statusCode === 0 || statusCode === null) return "";
    if (![200, 201, -3].includes(statusCode)) {
      return responseBody?.error?.message || responseBody?.helicone_error || "";
    }

    responseBody = Array.isArray(responseBody)
      ? responseBody
      : [responseBody].filter(Boolean);

    return responseBody
      .map((response: any) => {
        if (!response || !Array.isArray(response.candidates)) return "";

        return response.candidates
          .map((candidate: any) => {
            if (!candidate) return "";

            const contents = Array.isArray(candidate.content)
              ? candidate.content
              : [candidate.content].filter(Boolean);

            return contents
              .map((content: any) => {
                if (!content) return "";

                const parts = Array.isArray(content.parts)
                  ? content.parts
                  : [content.parts].filter(Boolean);

                return parts
                  .map((part: any) => {
                    if (part?.functionCall) {
                      return `Function Call: ${JSON.stringify(
                        part.functionCall
                      )}`;
                    }
                    return part && typeof part.text === "string"
                      ? part.text
                      : "";
                  })
                  .filter(Boolean)
                  .join("");
              })
              .join("");
          })
          .join("");
      })
      .join("");
  } catch (error) {
    console.error("Error parsing response text:", error);
    return "error_parsing_response";
  }
};

/**
 * Convert request contents to internal Message format
 */
const convertRequestMessages = (contents: any): Message[] => {
  const contentsArray = Array.isArray(contents)
    ? contents
    : [contents].filter(Boolean);

  return contentsArray
    .map((content: any) => {
      if (!content) return [];

      const parts = Array.isArray(content.parts)
        ? content.parts
        : [content.parts].filter(Boolean);

      // Find text and image parts
      const textParts = parts.filter(
        (part: any) => part && typeof part.text === "string"
      );
      const imagePart = parts.find(
        (part: any) => part && part.inlineData?.data
      );

      return [
        {
          role: content.role || "user",
          content: textParts.map((part: any) => part.text).join(" "),
          _type: (imagePart ? "image" : "message") as "image" | "message",
          image_url: imagePart?.inlineData?.data,
        },
      ];
    })
    .flat();
};

/**
 * Convert response to internal Message format
 */
const convertResponseMessages = (responseBody: any): Message[] => {
  if (!responseBody) return [];

  responseBody = Array.isArray(responseBody)
    ? responseBody
    : [responseBody].filter(Boolean);

  const messages: Message[] = [];

  for (const response of responseBody) {
    if (!response || !Array.isArray(response.candidates)) continue;

    for (const candidate of response.candidates) {
      if (!candidate) continue;

      const contents = Array.isArray(candidate.content)
        ? candidate.content
        : [candidate.content].filter(Boolean);

      for (const content of contents) {
        if (!content) continue;

        const parts = Array.isArray(content.parts)
          ? content.parts
          : [content.parts].filter(Boolean);

        // Extract text content
        const textParts = parts.filter(
          (part: any) => part && typeof part.text === "string"
        );
        const combinedContent = textParts
          .map((part: any) => part.text)
          .join("");

        // Check for function calls
        const functionCallPart = parts.find(
          (part: any) => part && part.functionCall
        );

        const functionCall = functionCallPart?.functionCall;
        const toolCalls: FunctionCall[] | undefined = functionCall
          ? [
              {
                name: functionCall.name,
                arguments: functionCall.args,
              },
            ]
          : undefined;

        messages.push({
          _type: functionCall ? "functionCall" : "message",
          role: content.role ?? "model",
          content: combinedContent || undefined,
          tool_calls: toolCalls,
        });
      }
    }
  }

  return messages;
};

/**
 * Convert internal messages back to Google message format
 */
const toExternalContents = (messages: Message[]): any[] => {
  if (!messages || !Array.isArray(messages)) return [];

  return messages.map((message) => {
    const parts: any[] = [];

    // Add text part if content exists
    if (message.content) {
      parts.push({
        text: message.content,
      });
    }

    // Add image part if it exists
    if (message._type === "image" && message.image_url) {
      parts.push({
        inlineData: {
          data: message.image_url,
        },
      });
    }

    // Add function call if it exists
    if (
      message._type === "functionCall" &&
      message.tool_calls &&
      message.tool_calls.length > 0
    ) {
      const functionCall = message.tool_calls[0];
      parts.push({
        functionCall: {
          name: functionCall.name,
          args: functionCall.arguments,
        },
      });
    }

    return {
      role: message.role || "user",
      parts,
    };
  });
};

/**
 * Build the Google Chat mapper with proper type safety
 */
export const googleChatMapper = new MapperBuilder<GoogleChatRequest>(
  "gemini-chat-v2"
)
  // Map basic request parameters
  .map("model", "schema.request.model")

  // Map generation config parameters
  .mapWithTransform(
    "generationConfig",
    "schema.request.temperature",
    (config) => config?.temperature,
    (value) => ({ temperature: value })
  )
  .mapWithTransform(
    "generationConfig",
    "schema.request.top_p",
    (config) => config?.topP,
    (value) => ({ topP: value })
  )
  .mapWithTransform(
    "generationConfig",
    "schema.request.max_tokens",
    (config) => config?.maxOutputTokens,
    (value) => ({ maxOutputTokens: value })
  )
  .mapWithTransform(
    "generationConfig",
    "schema.request.n",
    (config) => config?.candidateCount,
    (value) => ({ candidateCount: value })
  )
  .mapWithTransform(
    "generationConfig",
    "schema.request.stop",
    (config) => config?.stopSequences,
    (value) => ({ stopSequences: value })
  )

  // Map messages with transformation
  .mapWithTransform(
    "contents",
    "schema.request.messages",
    convertRequestMessages,
    toExternalContents
  )

  // Map preview request text
  // @ts-ignore - We need this mapper for preview data, even though the path isn't ideal
  .mapWithTransform(
    "contents",
    "preview.request",
    (req) => getRequestText(req),
    // Returning a minimal valid object when converting back
    (_: string) => ({ contents: [] })
  )
  .buildAndRegister();

/**
 * Maps a Google/Gemini request to our internal format
 */
export const mapGeminiRequestV2 = ({
  request,
  response,
  statusCode = 200,
  model,
}: {
  request: GoogleChatRequest;
  response: any;
  statusCode?: number;
  model: string;
}): LlmSchema => {
  // Extract model from response.modelVersion if available and model is not provided or is "unknown"
  const modelVersion =
    (!model || model === "unknown") && response?.modelVersion
      ? response.modelVersion
      : model || request.model;

  // Map the request using our path mapper
  const mappedRequest = googleChatMapper.toInternal({
    ...request,
    model: modelVersion,
  });

  // Add response data
  if (response) {
    const responseMessages = convertResponseMessages(response);
    const error = Array.isArray(response)
      ? response.find((item: any) => item?.error)?.error
      : response?.error;

    mappedRequest.schema.response = {
      messages: responseMessages,
      model: modelVersion,
      error: error
        ? {
            heliconeMessage: {
              message: error?.message,
              code: error?.code,
            },
          }
        : undefined,
    };

    mappedRequest.preview.response = getResponseText(response, statusCode);
    mappedRequest.preview.concatenatedMessages = [
      ...(mappedRequest.schema.request.messages || []),
      ...responseMessages,
    ];
  }

  return mappedRequest.schema;
};
