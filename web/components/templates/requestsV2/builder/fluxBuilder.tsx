import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

export class FluxBuilder extends AbstractRequestBuilder {
  getRequestText = () => {
    if (this.response.request_body.prompt) {
      return this.response.request_body.prompt;
    }

    return "";
  };

  getResponseText = () => {
    const statusCode = this.response.response_status;

    if ([200, 201, -3].includes(statusCode)) {
      if (this.response.response_body?.error) {
        return this.response.response_body?.error?.message || "";
      }

      // Since Flux doesn't have revised prompts, return an empty string
      return "";
    } else if (statusCode === 0 || statusCode === null) {
      return "";
    } else {
      return (
        this.response.response_body?.error?.message ||
        this.response.response_body?.helicone_error ||
        ""
      );
    }
  };

  getRender = () => {
    const statusCode = this.response.response_status;
    const responseText = this.getResponseText();

    if ([0, null].includes(statusCode)) {
      return <p>Pending...</p>;
    } else if ([200, 201, -3].includes(statusCode)) {
      return (
        <Completion
          request={this.getRequestText()}
          response={{
            title: "Response",
            text: "",
            image_url: this.response.response_body?.data
              ? this.response.response_body?.data[0]?.b64_json
              : "",
          }}
          rawRequest={this.response.request_body}
          rawResponse={this.response.response_body}
        />
      );
    } else {
      return (
        <Completion
          request={this.getRequestText()}
          response={{
            title: "Error",
            text: responseText,
          }}
          rawRequest={this.response.request_body}
          rawResponse={this.response.response_body}
        />
      );
    }
  };

  protected buildSpecific(): SpecificFields {
    return {
      requestText: this.getRequestText(),
      responseText: this.getResponseText(),
      render: this.getRender,
    };
  }
}
