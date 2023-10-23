import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class UnknownBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    return {
      requestText: "Unsupported model.",
      responseText: "This model is not supported by Helicone.",
      render: (
        <Completion
          request={"Unsupported model."}
          response={{
            title: "Error",
            text: "This model is not supported by Helicone.",
          }}
        />
      ),
    };
  }
}

export default UnknownBuilder;
