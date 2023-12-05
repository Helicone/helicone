import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class CompletionBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const requestBody = this.response.llmSchema?.request ?? null;
    const responseBody = this.response.llmSchema?.response ?? null;

    const getResponseText = () => {
      const statusCode = this.response.response_status;
      if (statusCode === 0 || statusCode === null) {
        // pending response
        return "";
      }

      const errorMessage = responseBody?.error?.message;
      if (errorMessage) {
        // Error message from the response
        return errorMessage;
      }

      if ([200, 201, -3].includes(statusCode) && responseBody) {
        // Successful response
        const completion = responseBody?.completions?.[0];
        return completion ? JSON.stringify(completion) : "";
      }

      return "";
    };

    const getRenderContent = () => {
      if ([0, null].includes(this.response.response_status)) {
        return <p>Pending...</p>;
      } else if (this.response.response_status === 200) {
        return (
          <Completion
            request={requestBody?.prompt || ""}
            response={{
              title: "Response",
              text: (responseBody?.completions?.[0] as string) ?? "",
            }}
            rawRequest={requestBody}
            rawResponse={responseBody}
          />
        );
      } else {
        return (
          <Completion
            request={requestBody?.prompt || ""}
            response={{
              title: "Error",
              text: responseBody?.error?.message || "",
            }}
            rawRequest={requestBody}
            rawResponse={responseBody}
          />
        );
      }
    };

    return {
      requestText: requestBody?.prompt || "",
      responseText: getResponseText(),
      render: getRenderContent(),
    };
  }
}

export default CompletionBuilder;
