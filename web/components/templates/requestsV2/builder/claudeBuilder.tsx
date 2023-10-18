import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class ClaudeBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const getResponseText = () => {
      const statusCode = this.response.response_status;
      if ([200, 201, -3].includes(statusCode)) {
        // successful response, check for an error from openai
        if (this.response.response_body?.error) {
          return this.response.response_body?.error?.message || "";
        }
        // successful response, check for choices

        return this.response.response_body?.body
          ? this.response.response_body?.body?.completion ?? ""
          : this.response.response_body?.completion ?? "";
      } else if (statusCode === 0 || statusCode === null) {
        // pending response
        return "";
      } else {
        // network error
        return this.response.response_body?.error?.message || "network error";
      }
    };
    return {
      requestText: this.response.request_body.prompt || "Invalid Prompt",
      responseText: getResponseText(),
      render:
        this.response.response_status === 0 ||
        this.response.response_status === null ? (
          <p>Pending...</p>
        ) : this.response.response_status === 200 ? (
          <Completion
            request={this.response.request_body.prompt}
            response={{
              title: "Response",
              text:
                this.response.response_body?.body ??
                this.response.response_body?.body?.completion ??
                this.response.response_body?.completion ??
                "",
            }}
          />
        ) : (
          <Completion
            request={this.response.request_body.prompt || "n/a"}
            response={{
              title: "Error",
              text: this.response.response_body?.error?.message || "n/a",
            }}
          />
        ),
    };
  }
}

export default ClaudeBuilder;
