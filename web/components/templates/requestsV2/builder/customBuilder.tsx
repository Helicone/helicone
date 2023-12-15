import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class CustomBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const responseText =
      this.response.response_body?.text ??
      JSON.stringify(this.response.response_body, null, 2);
    const requestText =
      this.response.request_body?.prompt ??
      JSON.stringify(this.response.request_body, null, 2);
    return {
      requestText: requestText,
      responseText: responseText,
      render:
        this.response.response_status === 0 ||
        this.response.response_status === null ? (
          <p>Pending...</p>
        ) : this.response.response_status === 200 ? (
          <Completion
            request={requestText}
            response={{
              title: "Response",
              text: responseText,
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        ) : (
          <Completion
            request={requestText}
            response={{
              title: "Error",
              text: responseText,
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        ),
    };
  }
}

export default CustomBuilder;
