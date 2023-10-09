import { modelCost } from "../../../../lib/api/metrics/costCalc";
import { Chat } from "../../requests/chat";
import AbstractRequestBuilder, {
  NormalizedRequest,
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
      const messages = this.response.request_body.messages;
      if (messages) {
        if (messages.length > 0) {
          return messages.at(-1).content;
        } else {
          return JSON.stringify(messages);
        }
      } else {
        return "";
      }
    };

    const getResponseText = () => {
      const statusCode = this.response.response_status;
      if (statusCode === 200) {
        // successful response, check for an error from openai
        if (this.response.response_body?.error) {
          return this.response.response_body?.error?.message || "";
        }
        // successful response, check for choices
        if (this.response.response_body?.choices) {
          if (hasNoContent) {
            return JSON.stringify(
              this.response.response_body?.choices?.[0]?.message?.function_call,
              null,
              2
            );
          } else {
            return this.response.response_body?.choices?.[0]?.message?.content;
          }
        }
      } else if (statusCode === 0 || statusCode === null) {
        // pending response
        return "";
      } else {
        // network error
        return this.response.response_body?.error?.message || "network error";
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
            request={this.response.request_body.messages}
            response={this.response.response_body?.choices?.[0]?.message}
            status={this.response.response_status}
          />
        ) : (
          <div className="w-full flex flex-col text-left space-y-8 text-sm">
            {this.response.request_body.messages && (
              <Chat
                request={this.response.request_body.messages}
                response={null}
                status={this.response.response_status}
              />
            )}
            <div className="w-full flex flex-col text-left space-y-1 text-sm">
              <p className="font-semibold text-gray-900 text-sm">Error</p>
              <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
                {this.response.response_body?.error?.message || ""}
              </p>
            </div>
          </div>
        ),
    };
  }
}

export default ChatGPTBuilder;
