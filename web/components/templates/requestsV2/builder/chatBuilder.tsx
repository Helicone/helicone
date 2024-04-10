import { Chat } from "../../requests/chat";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";
class ChatBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const responseBody = this.response.llmSchema?.response ?? null;
    const requestBody = this.response.llmSchema?.request ?? null;
    const hasNoContent = responseBody?.message?.content === null;

    const getRequestText = () => {
      // Check if there are any messages
      if (!requestBody?.messages) {
        return "";
      }

      // Check if there is a last message and it has content
      const lastMessageContent = requestBody.messages.at(-1)?.content;
      if (lastMessageContent) {
        // check if lastMessageContent is an object
        if (typeof lastMessageContent === "string") {
          return lastMessageContent;
        } else if (typeof lastMessageContent === "object") {
          return JSON.stringify(lastMessageContent, null, 2);
        } else {
          return "";
        }
      }

      // If there are messages but no content, stringify the array
      if (requestBody.messages.length > 0) {
        return JSON.stringify(requestBody.messages);
      }

      // Default return if the above conditions are not met
      return "";
    };

    const getResponseText = () => {
      const statusCode = this.response.response_status;

      if (statusCode === 0 || statusCode === null) {
        // pending response
        return "";
      }

      const errorMessage = responseBody?.error?.message;
      if (errorMessage) {
        // Error message from the response
        return errorMessage;
      }

      if ([200, 201, -3].includes(statusCode) && responseBody) {
        // Successful response
        const message = responseBody.message;
        if (message) {
          if (hasNoContent) {
            return JSON.stringify({
              name: message.function_call?.name,
              arguments: message.function_call?.arguments,
            });
          } else {
            // check if the message is a string
            if (typeof message.content === "string") {
              return message.content || "";
            } else {
              return JSON.stringify(message.content || "", null, 2);
            }
          }
        }
      }

      return "";
    };

    const renderChat = () => {
      return (
        <Chat
          llmSchema={this.response.llmSchema ?? undefined}
          requestBody={this.response.request_body}
          requestId={this.response.request_id}
          responseBody={this.response.response_body}
          status={this.response.response_status}
          model={this.model}
        />
      );
    };

    const renderError = () => {
      return (
        <div className="w-full flex flex-col text-left space-y-8 text-sm">
          {requestBody?.messages && renderChat()}
          <div className="w-full flex flex-col text-left space-y-1 text-sm">
            <p className="font-semibold text-gray-900 text-sm">Error</p>
            <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
              {responseBody?.error?.message || "An unknown error occurred."}
            </p>
          </div>
        </div>
      );
    };

    const renderPending = () => {
      return <p>Pending...</p>;
    };

    const getRenderContent = () => {
      if ([0, null].includes(this.response.response_status)) {
        return renderPending();
      } else if (this.response.response_status === 200) {
        return renderChat();
      } else {
        return renderError();
      }
    };

    return {
      requestText: getRequestText(),
      responseText: getResponseText(),
      render: getRenderContent,
    };
  }
}

export default ChatBuilder;
