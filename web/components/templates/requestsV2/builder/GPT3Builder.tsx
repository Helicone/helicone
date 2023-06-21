import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  NormalizedRequest,
} from "./abstractRequestBuilder";

class GPT3Builder extends AbstractRequestBuilder {
  build(): NormalizedRequest {
    return {
      createdAt: this.response.request_created_at,
      requestText: this.response.request_body.prompt,
      responseText:
        this.response.response_status === 200
          ? this.response.response_body.choices[0].text
          : this.response.response_body.error.message,
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
      render: (
        <h1>hello world</h1>
        // <Completion
        //   request={this.response.request_body.prompt}
        //   response={
        //     this.response.response_status === 200
        //       ? this.response.response_body.choices[0].text
        //       : this.response.response_body.error.message
        //   }
        // />
      ),
    };
  }
}

export default GPT3Builder;
