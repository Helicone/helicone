import { LlmSchema, Message } from "../../types";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  try {
    const contents = requestBody.contents;
    const messages = Array.isArray(contents)
      ? contents
      : [contents].filter(Boolean);

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return "";

    const parts = Array.isArray(lastMessage.parts)
      ? lastMessage.parts
      : [lastMessage.parts].filter(Boolean);
    const textParts = parts.filter(
      (part: any) => part && typeof part.text === "string"
    );

    return textParts.map((part: any) => part.text).join("\n");
  } catch (error) {
    console.error("Error parsing request text:", error);
    return "error_parsing_request";
  }
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
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

const getRequestMessages = (contents: any[]): Message[] => {
  return contents
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

export const mapGeminiPro: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
  model,
}) => {
  const generateConfig = request?.generationConfig || {};
  const contents = request?.contents;
  const messages = Array.isArray(contents)
    ? contents
    : [contents].filter(Boolean);

  // Extract model from response.modelVersion if available and model is not provided or is "unknown"
  const modelVersion =
    (!model || model === "unknown") && response?.modelVersion
      ? response.modelVersion
      : model;

  const requestMessages = getRequestMessages(messages);

  response = Array.isArray(response) ? response : [response].filter(Boolean);

  const combinedContent = response
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
                .map((part: any) =>
                  part && typeof part.text === "string" ? part.text : ""
                )
                .filter(Boolean)
                .join("");
            })
            .join("");
        })
        .join("");
    })
    .join("");

  const functionCall = response
    .map((response: any) => {
      if (!response || !Array.isArray(response.candidates)) return null;

      return response.candidates
        .map((candidate: any) => {
          if (!candidate) return null;

          const contents = Array.isArray(candidate.content)
            ? candidate.content
            : [candidate.content].filter(Boolean);

          return contents
            .map((content: any) => {
              if (!content) return null;

              const parts = Array.isArray(content.parts)
                ? content.parts
                : [content.parts].filter(Boolean);

              return parts.find((part: any) => part && part.functionCall)
                ?.functionCall;
            })
            .find((funcCall: any) => funcCall);
        })
        .find((funcCall: any) => funcCall);
    })
    .find((funcCall: any) => funcCall);

  const firstContent = response[0]?.candidates?.[0]?.content;

  const responseMessages: Message | undefined =
    combinedContent || functionCall
      ? {
          role: firstContent?.role ?? "model",
          content: combinedContent || undefined,
          tool_calls: functionCall
            ? [
                {
                  name: functionCall.name,
                  arguments: JSON.parse(JSON.stringify(functionCall.args)),
                },
              ]
            : undefined,
          _type: functionCall ? "functionCall" : "message",
        }
      : undefined;

  const error = response.find((item: any) => item?.error)?.error;

  const schema: LlmSchema = {
    request: {
      model: modelVersion,
      prompt: null,
      max_tokens: generateConfig?.maxOutputTokens,
      temperature: generateConfig?.temperature,
      top_p: generateConfig?.topP,
      n: generateConfig?.candidateCount,
      stream: false,
      stop: generateConfig?.stopSequences,
      presence_penalty: 0,
      frequency_penalty: 0,
      messages: requestMessages,
    },
    response: {
      messages: responseMessages ? [responseMessages] : [],
      error: error
        ? {
            heliconeMessage: {
              message: error?.message,
              code: error?.code,
            },
          }
        : undefined,
      model: modelVersion,
    },
  };

  return {
    schema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode),
      concatenatedMessages: [
        ...requestMessages,
        ...(responseMessages ? [responseMessages] : []),
      ],
    },
  };
};
