import { Chat } from "../../requests/chat";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class ChatGPTBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const hasNoContent = this.response.response_body?.choices
      ? this.response.response_body?.choices?.[0]?.message?.content === null ||
        this.response.response_body?.choices?.[0]?.message?.content ===
          undefined
      : true;

    const getRequestText = () => {
      // check for too large
      if (this.response.request_body.heliconeMessage) {
        return this.response.request_body.heliconeMessage;
      }
      const messages = this.response.request_body.messages;
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
                    message.content.some(
                      (content: any) => content.type === "text"
                    ))
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

    const getResponseText = () => {
      const statusCode = this.response.response_status;

      if ([200, 201, -3].includes(statusCode)) {
        // successful response, check for an error from openai
        if (this.response.response_body?.error) {
          return this.response.response_body?.error?.message || "";
        }
        //
        if (/^claude/.test(this.model)) {
          return this.response.response_body?.content[0].text || "";
        }
        // successful response, check for choices
        if (this.response.response_body?.choices) {
          if (hasNoContent) {
            const message = this.response.response_body?.choices?.[0]?.message;

            const hasFunctionCall = () => {
              if (message?.function_call) {
                return true;
              }
              if (message?.tool_calls) {
                const tools = message.tool_calls;

                return Array.isArray(tools)
                  ? tools.some(
                      (tool: { type: string }) => tool.type === "function"
                    )
                  : false;
              }
              return false;
            };

            if (hasFunctionCall()) {
              const tools = message.tool_calls;
              const functionTools = tools?.find(
                (tool: { type: string }) => tool.type === "function"
              ).function;

              if (functionTools !== undefined && functionTools !== null) {
                return `${functionTools.name}(${functionTools.arguments})`;
              } else {
                return `${message.function_call?.name}(${message.function_call?.arguments})`;
              }
            } else {
              return JSON.stringify(
                this.response.response_body?.choices?.[0]?.message
                  ?.function_call,
                null,
                2
              );
            }
          } else {
            return this.response.response_body?.choices?.[0]?.message?.content;
          }
        }
      } else if (statusCode === 0 || statusCode === null) {
        // pending response
        return "";
      } else {
        // network error
        return (
          this.response.response_body?.error?.message ||
          this.response.response_body?.helicone_error ||
          ""
        );
      }
    };

    return {
      requestText: getRequestText(),
      responseText: getResponseText(),
      render:
        this.response.response_status === 0 ||
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
            <div className="w-full flex flex-col text-left space-y-1 text-sm">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Error
              </p>
              <p className="text-gray-900 dark:text-gray-100 p-2 border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
                {this.response.response_body?.error?.message ||
                  this.response.response_body?.helicone_error ||
                  ""}
              </p>
            </div>
          </div>
        ),
    };
  }
}

export default ChatGPTBuilder;
