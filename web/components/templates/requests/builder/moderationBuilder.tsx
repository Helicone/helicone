import { Completion } from "./components/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class ModerationBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    return {
      requestText: this.response.request_body.input,
      responseText:
        this.response.response_status === 0 ||
        this.response.response_status === null
          ? ""
          : this.response.response_status === 200
          ? JSON.stringify(this.response.response_body.results || "", null, 4)
          : this.response.response_body?.error?.message || "",
      render: () => {
        return this.response.response_status === 0 ||
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
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        ) : (
          <Completion
            request={this.response.request_body.input}
            response={{
              title: "Error",
              text: this.response.response_body?.error?.message || "",
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        );
      },
    };
  }
}

export default ModerationBuilder;
