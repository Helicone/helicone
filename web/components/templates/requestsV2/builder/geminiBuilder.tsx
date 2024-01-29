import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class GeminiBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const hasNoContent = this.response.response_body?.choices
      ? this.response.response_body?.choices?.[0]?.message?.content === null ||
        this.response.response_body?.choices?.[0]?.message?.content ===
          undefined
      : true;

    const getRequestText = () => {
      // New request structure handling
      const contents = this.response.request_body.contents;
      if (contents && Array.isArray(contents) && contents.length > 0) {
        // Concatenate all text parts from all content objects
        return contents
          .map((content) =>
            content.parts
              .map(
                (part: any) =>
                  part.text || // Assuming 'text' is the primary data we're interested in
                  part.inlineData?.data || // Handling inline data
                  part.fileData?.fileUri // Handling file data
              )
              .join(" ")
          )
          .join(" ");
      } else {
        return ""; // Default return if no contents are found
      }
    };

    const getResponseText = () => {
      const candidates = this.response.response_body.candidates;
      if (candidates && Array.isArray(candidates) && candidates.length > 0) {
        // Concatenate all text parts from the first candidate's content
        return candidates[0].content.parts
          .map((part: any) => part.text)
          .join(" ");
      } else {
        return ""; // Default return if no candidates are found
      }
    };

    return {
      requestText: getRequestText(),
      responseText: getResponseText(),
      render: () => {
        const responseStatus = this.response.response_status;
        const responseBody = this.response.response_body;
        let responseContent = "";

        // Check if the status is successful and there are candidates in the response
        if (
          responseStatus === 200 &&
          responseBody?.candidates &&
          responseBody.candidates.length > 0
        ) {
          // Extract the text parts from the first candidate's content
          responseContent = responseBody.candidates[0].content.parts
            .map((part: any) => part.text)
            .join(" ");
        } else if (responseBody?.error) {
          // If there is an error in the response body, use that
          responseContent = responseBody.error.message || "";
        } else if (responseStatus !== 200) {
          // For any other non-success status
          responseContent = responseBody?.helicone_error || "An error occurred";
        }

        // Determine if the request is pending based on its status
        const isPending = responseStatus === 0 || responseStatus === null;

        return isPending ? (
          <p>Pending...</p>
        ) : (
          <Completion
            request={getRequestText()}
            response={{
              title: responseStatus === 200 ? "Response" : "Error",
              text: responseContent,
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
          />
        );
      },
    };
  }
}

export default GeminiBuilder;
