import { ReactNode } from "react";
import { modelCost } from "../../../../lib/api/metrics/costCalc";
import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  NormalizedRequest,
  SpecificFields,
} from "./abstractRequestBuilder";

class GPT3Builder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const getResponseText = () => {
      const statusCode = this.response.response_status;
      if (statusCode === 200) {
        // successful response, check for an error from openai
        if (this.response.response_body?.error) {
          return this.response.response_body?.error?.message || "";
        }
        // successful response, check for choices
        if (this.response.response_body?.choices) {
          return this.response.response_body?.choices[0].text;
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
              text: this.response.response_body?.choices
                ? this.response.response_body?.choices[0].text
                : "",
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

export default GPT3Builder;
