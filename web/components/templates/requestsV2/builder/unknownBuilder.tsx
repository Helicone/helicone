import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class UnknownBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    return {
      requestText: "",
      responseText: "",
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

export default UnknownBuilder;
