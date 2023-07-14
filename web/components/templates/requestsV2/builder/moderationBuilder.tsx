import { modelCost } from "../../../../lib/api/metrics/costCalc";
import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  NormalizedRequest,
} from "./abstractRequestBuilder";

class ModerationBuilder extends AbstractRequestBuilder {
  build(): NormalizedRequest {
    return {
      id: this.response.request_id,
      createdAt: this.response.request_created_at,
      path: this.response.request_path,
      requestText: this.response.request_body.input,
      responseText:
        this.response.response_status === 0 ||
        this.response.response_status === null
          ? ""
          : this.response.response_status === 200
          ? JSON.stringify(this.response.response_body.results || "", null, 4)
          : this.response.response_body?.error?.message || "",
      completionTokens: this.response.completion_tokens,
      latency: this.response.delay_ms,
      promptTokens: this.response.prompt_tokens,
      status: {
        statusType: this.getStatusType(),
        code: this.response.response_status,
      },
      totalTokens: this.response.total_tokens,
      user: this.response.request_user_id,
      customProperties: this.response.request_properties,
      model:
        this.response.request_body.model || this.response.response_body.model,
      requestBody: this.response.request_body,
      responseBody: this.response.response_body,
      cost: 0,
      render:
        this.response.response_status === 0 ||
        this.response.response_status === null ? (
          <p>Pending...</p>
        ) : this.response.response_status === 200 ? (
          <Completion
            request={this.response.request_body.input}
            response={{
              title: "Response",
              text: JSON.stringify(
                this.response.response_body.results || "",
                null,
                4
              ),
            }}
          />
        ) : (
          <Completion
            request={this.response.request_body.input}
            response={{
              title: "Error",
              text: this.response.response_body?.error?.message || "",
            }}
          />
        ),
    };
  }
}

export default ModerationBuilder;
