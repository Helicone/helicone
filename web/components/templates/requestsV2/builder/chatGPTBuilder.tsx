import { Chat } from "../../requests/chat";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

export const helper = (x: any) => {
  const messages = x.messages;
  if (messages) {
    if (messages.length > 0) {
      const content = messages.at(-1).content;

      if (Array.isArray(content)) {
        // if the first element inside of content is a string, return the string
        if (typeof content[0] === "string") {
          return content[0];
        }
        // image handling
        // find the last message that has the key text OR type:text is inside of `content`
        const textMessage = messages
          .slice()
          .reverse()
          .find(
            (message: any) =>
              message.text ||
              (message.content &&
                Array.isArray(message.content) &&
                message.content.some((content: any) => content.type === "text"))
          );

        return textMessage?.text || textMessage?.content[0].text || "";
      } else {
        return content;
      }
    } else {
      return JSON.stringify(messages);
    }
  } else {
    return "";
  }
};

class ChatGPTBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const hasNoContent = this.response.response_body?.choices
      ? this.response.response_body?.choices?.[0]?.message?.content === null ||
        this.response.response_body?.choices?.[0]?.message?.content ===
          undefined
      : true;

    const getRequestText = () => {
      try {
        // Check for direct heliconeMessage
        const heliconeMessage = this.response?.request_body?.heliconeMessage;
        if (heliconeMessage) {
          return heliconeMessage;
        }

        // Process messages
        const messages = this.response?.request_body?.messages;
        if (!Array.isArray(messages) || messages.length === 0) {
          return ""; // Return empty string for no or empty messages
        }

        // Get the last message content
        const lastMessageContent = messages.at(-1)?.content;

        // If content is an array, try to find the first string or a text message
        if (Array.isArray(lastMessageContent)) {
          const firstString = lastMessageContent.find(
            (item) => typeof item === "string"
          );
          if (firstString) return firstString;

          // Attempt to find a text type within any message's content
          for (const message of [...messages].reverse()) {
            const textContent = message.content?.find(
              (c: any) => c.type === "text"
            );
            if (textContent && textContent.text) {
              return textContent.text;
            }
          }
          return ""; // Fallback if no text content is found
        }

        // If content is an object, handle specific keys
        else if (
          typeof lastMessageContent === "object" &&
          lastMessageContent !== null
        ) {
          return lastMessageContent.transcript || "hello"; // Return 'transcript' or default to "hello"
        }

        // Return the last message content if it's neither an array nor an object, or its string representation
        return typeof lastMessageContent === "string"
          ? lastMessageContent
          : JSON.stringify(lastMessageContent || "");
      } catch (error) {
        console.error("Error parsing request text:", error);
        return "";
      }
    };

    const getResponseText = () => {
      try {
        const { response_status: statusCode, response_body: responseBody } =
          this.response;

        // Handle pending response or network error scenarios upfront
        if (statusCode === 0 || statusCode === null) return ""; // Pending response
        if (![200, 201, -3].includes(statusCode)) {
          // Network error or other non-success statuses
          return (
            responseBody?.error?.message || responseBody?.helicone_error || ""
          );
        }

        // For successful responses
        if (responseBody?.error) {
          // Check for an error from OpenAI
          return responseBody.error.message || "";
        }

        if (/^claude/.test(this.model) && responseBody?.content?.[0]?.text) {
          // Specific handling for Claude model
          return responseBody.content[0].text;
        }

        // Handle choices
        const firstChoice = responseBody?.choices?.[0];
        if (firstChoice) {
          if (hasNoContent) {
            // Logic for when there's no content
            const { message } = firstChoice;

            // Helper function to determine if there's a function call
            const hasFunctionCall = () => {
              if (message?.function_call) return true;
              if (Array.isArray(message?.tool_calls)) {
                return message.tool_calls.some(
                  (tool: any) => tool.type === "function"
                );
              }
              return false;
            };

            // Helper function to check if message.text is an object
            const hasText = () =>
              typeof message?.text === "object" && message.text !== null;

            if (hasText()) {
              return JSON.stringify(message.text);
            } else if (hasFunctionCall()) {
              const tools = message.tool_calls;
              const functionTool = tools?.find(
                (tool: any) => tool.type === "function"
              )?.function;
              if (functionTool) {
                return `${functionTool.name}(${functionTool.arguments})`;
              } else {
                return JSON.stringify(message.function_call, null, 2);
              }
            } else {
              return JSON.stringify(message.function_call, null, 2);
            }
          } else {
            // When there's content available
            return firstChoice.message?.content || "";
          }
        }
        // Fallback for missing choices
        return "";
      } catch (error) {
        console.error("Error parsing response text:", error);
        return "";
      }
    };

    return {
      requestText: getRequestText(),
      responseText: getResponseText(),
      render: () => {
        return this.response.response_status === 0 ||
          this.response.response_status === null ? (
          <p>Pending...</p>
        ) : this.response.response_status === 200 ? (
          <Chat
            requestBody={this.response.request_body}
            responseBody={this.response.response_body}
            status={this.response.response_status}
            requestId={this.response.request_id}
            model={this.model}
          />
        ) : (
          <div className="w-full flex flex-col text-left space-y-8 text-sm">
            {this.response.request_body.messages && (
              <Chat
                requestBody={this.response.request_body}
                responseBody={this.response.response_body}
                status={this.response.response_status}
                requestId={this.response.request_id}
                model={this.model}
              />
            )}
            {this.response.response_status !== -4 && (
              <div className="w-full flex flex-col text-left space-y-1 text-sm">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  Error
                </p>
                <p className="text-gray-900 dark:text-gray-100 p-2 border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
                  {this.response.response_body?.error?.message ||
                    this.response.response_body?.helicone_error ||
                    ""}
                </p>
              </div>
            )}
          </div>
        );
      },
    };
  }
}

export default ChatGPTBuilder;
