import React from "react";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";
import { Completion } from "./components/completion";

class OpenAIAssistantBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const getRequestText = () => {
      const requestBody = this.response.request_body;
      if (requestBody.role && requestBody.content) {
        return JSON.stringify(
          {
            role: requestBody.role,
            content: requestBody.content,
            metadata: requestBody.metadata,
          },
          null,
          2
        );
      }
      return JSON.stringify(requestBody, null, 2);
    };

    const getResponseText = () => {
      const responseBody = this.response.response_body;
      if (responseBody?.data && Array.isArray(responseBody.data)) {
        const assistantMessage = responseBody.data.find(
          (msg: any) => msg.role === "assistant"
        );
        if (assistantMessage?.content?.[0]?.text?.value) {
          return assistantMessage.content[0].text.value;
        }
      }
      return JSON.stringify(responseBody, null, 2);
    };

    const renderChat = () => {
      const responseBody = this.response.response_body;
      const messages =
        responseBody.data?.map((msg: any) => ({
          role: msg.role,
          content: msg.content[0]?.text?.value || JSON.stringify(msg.content),
        })) || [];

      return (
        <Completion
          request={this.response.request_body.instructions}
          response={{
            title: "Response",
            text: "",
          }}
          rawRequest={this.response.request_body}
          rawResponse={this.response.response_body}
          defaultMode="json"
        />
      );
    };

    const renderError = () => {
      return (
        <div className="w-full flex flex-col text-left space-y-4 text-sm">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error:</strong>
            <pre className="mt-2 whitespace-pre-wrap">
              {this.response.response_body?.error?.message ||
                "An unknown error occurred."}
            </pre>
          </div>
        </div>
      );
    };

    const renderPending = () => {
      return <p className="text-gray-500 italic">Pending...</p>;
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
      requestText: this.response.request_body?.instructions || getRequestText(),
      responseText: getResponseText(),
      render: getRenderContent,
    };
  }
}

export default OpenAIAssistantBuilder;
