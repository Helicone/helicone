import { modelCost } from "../../../../lib/api/metrics/costCalc";
import { Chat } from "../../requests/chat";
import AbstractRequestBuilder, {
  NormalizedRequest,
} from "./abstractRequestBuilder";

class FunctionGPTBuilder extends AbstractRequestBuilder {
  build(): NormalizedRequest {
    return {
      createdAt: this.response.request_created_at,
      requestText: this.response.request_body.messages.at(-1).content,
      responseText:
        this.response.response_status === 0 ||
        this.response.response_status === null
          ? ""
          : this.response.response_status === 200
          ? this.response.response_body?.choices
            ? JSON.stringify(
                this.response.response_body?.choices[0].message.function_call,
                null,
                2
              )
            : ""
          : this.response.response_body?.error?.message || "",
      completionTokens: this.response.completion_tokens,
      latency: this.response.delay_ms,
      promptTokens: this.response.prompt_tokens,
      status: this.response.response_status,
      totalTokens: this.response.total_tokens,
      user: this.response.request_user_id,
      customProperties: this.response.request_properties,
      model: this.response.request_body.model,
      requestBody: this.response.request_body,
      responseBody: this.response.response_body,
      cost: modelCost({
        model:
          this.response.request_body.model || this.response.response_body.model,
        sum_completion_tokens: this.response.completion_tokens || 0,
        sum_prompt_tokens: this.response.prompt_tokens || 0,
        sum_tokens: this.response.total_tokens || 0,
      }),
      render:
        this.response.response_status === 0 ||
        this.response.response_status === null ? (
          <p>Pending...</p>
        ) : this.response.response_status === 200 ? (
          <Chat
            chatProperties={{
              request: this.response.request_body.messages,
              response: {
                role: "assistant",
                content: JSON.stringify(
                  this.response.response_body?.choices[0].message.function_call,
                  null,
                  2
                ),
              },
            }}
            status={this.response.response_status}
          />
        ) : (
          <div className="w-full flex flex-col text-left space-y-8 text-sm">
            <Chat
              chatProperties={{
                request: this.response.request_body.messages,
                response: null,
              }}
              status={this.response.response_status}
            />
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

export default FunctionGPTBuilder;
