import { enforceString } from "../../../../lib/helpers/typeEnforcers";
import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class GeminiBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    const getRequestText = () => {
      try {
        const parts = this.response.request_body?.contents?.parts;

        const textMessage = parts
          .slice()
          .reverse()
          .find((part: any) => part.text.text || part.text);

        return JSON.stringify(textMessage, null, 2);

        return textMessage?.text || textMessage?.parts[0].text || "";
      } catch (e) {
        return "ERROR: Failed to parse Gemini request";
      }
    };
    const getResponseText = () => {
      try {
        const parts =
          this.response.response_body?.candidates[0]?.content?.parts;
        // iterate through parts backwards and find the first message that has `text` field
        const textMessage = parts
          .slice()
          .reverse()
          .find((part: any) => part.text || part.text.text);

        return textMessage?.text || "";
      } catch (e) {
        return "ERROR: Failed to parse Gemini response";
      }
    };
    return {
      requestText: getRequestText(),
      responseText: getResponseText(),
      render: () => {
        return (
          <Completion
            request={""}
            response={{
              title: "Response",
              text: "",
            }}
            rawRequest={this.response.request_body}
            rawResponse={this.response.response_body}
            defaultMode="json"
          />
        );
      },
    };
  }
}

export default GeminiBuilder;
