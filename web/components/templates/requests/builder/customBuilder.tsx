import { Completion } from "./components/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class CustomBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const getRequestText = () => {
      if (this.response.request_body?.prompt) {
        if (typeof this.response.request_body?.prompt === "string") {
          return this.response.request_body?.prompt;
        } else {
          return JSON.stringify(this.response.request_body?.prompt, null, 2);
        }
      } else {
        return JSON.stringify(this.response.request_body, null, 2);
      }
    };
    const getResponseText = () => {
      if (this.response.response_body?.text) {
        if (typeof this.response.response_body?.text === "string") {
          return this.response.response_body?.text;
        } else {
          return JSON.stringify(this.response.response_body?.text, null, 2);
        }
      } else {
        return JSON.stringify(this.response.response_body, null, 2);
      }
    };

    return {
      requestText: getRequestText(),
      responseText: getResponseText(),
      render: () => {
        return this.response.response_status === 0 ||
          this.response.response_status === null ? (
          <p>Pending...</p>
        ) : this.response.response_status === 200 ? (
          <Completion
            request={getRequestText()}
            response={{
              title: "Response",
              text: getResponseText(),
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        ) : (
          <Completion
            request={getRequestText()}
            response={{
              title: "Error",
              text: getResponseText(),
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        );
      },
    };
  }
}

export default CustomBuilder;
