import { modelCost } from "../../../../lib/api/metrics/costCalc";
import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class EmbeddingBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const getResponseText = () => {
      const statusCode = this.response.response_status;
      if ([200, 201, -3].includes(statusCode)) {
        // successful response, check for an error from openai
        if (this.response.response_body?.error) {
          return this.response.response_body?.error?.message || "";
        }
        // successful response, check for choices
        if (
          this.response.response_body?.data &&
          this.response.response_body?.data.length > 0
        ) {
          return JSON.stringify(
            this.response.response_body?.data?.[0].embedding
          );
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
      requestText: this.response.request_body.input || "Invalid Input",
      responseText: getResponseText(),
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
                this.response.response_body?.data?.[0].embedding,
                null,
                4
              ),
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        ) : (
          <Completion
            request={this.response.request_body.input || "n/a"}
            response={{
              title: "Error",
              text: this.response.response_body?.error?.message || "n/a",
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        ),
    };
  }
}

export default EmbeddingBuilder;
