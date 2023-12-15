import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";
import { isArray } from "@apollo/client/utilities";

class GPT3Builder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const getRequestText = () => {
      if (this.response.request_body.prompt) {
        return this.response.request_body.prompt;
      }

      // mistral support
      if (
        this.response.request_body.messages &&
        isArray(this.response.request_body.messages)
      ) {
        // start backwards in the array and find the role "user" and then render the "content"
        const message = this.response.request_body.messages;
        const userMessage = message.find(
          (m: { role: string; content: string }) => m.role === "user"
        );
        return userMessage?.content ?? "";
      } else {
        return "";
      }
    };

    const getResponseText = () => {
      const statusCode = this.response.response_status;
      if ([200, 201, -3].includes(statusCode)) {
        // successful response, check for an error from openai
        if (this.response.response_body?.error) {
          return this.response.response_body?.error?.message || "";
        }
        // successful response, check for choices
        if (this.response.response_body?.choices) {
          return this.response.response_body?.choices &&
            this.response.response_body?.choices[0]
            ? this.response.response_body?.choices[0].text
            : "";
        }
      } else if (statusCode === 0 || statusCode === null) {
        // pending response
        return "";
      } else {
        // network error
        return (
          this.response.response_body?.error?.message ||
          this.response.response_body?.helicone_error ||
          ""
        );
      }
    };

    return {
      requestText: getRequestText(),
      responseText: getResponseText(),
      render:
        this.response.response_status === 0 ||
        this.response.response_status === null ? (
          <p>Pending...</p>
        ) : this.response.response_status === 200 ? (
          <Completion
            request={getRequestText()}
            response={{
              title: "Response",
              text:
                this.response.response_body?.choices &&
                this.response.response_body?.choices[0]
                  ? this.response.response_body?.choices[0].text ||
                    this.response.response_body?.choices[0].message
                  : "",
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        ) : (
          <Completion
            request={getRequestText()}
            response={{
              title: "Error",
              text:
                this.response.response_body?.error?.message ||
                this.response.response_body?.helicone_error ||
                "",
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        ),
    };
  }
}

export default GPT3Builder;
