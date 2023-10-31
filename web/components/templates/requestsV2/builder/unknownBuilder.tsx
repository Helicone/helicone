import { Completion } from "../../requests/completion";
import AbstractRequestBuilder, {
  SpecificFields,
} from "./abstractRequestBuilder";

class UnknownBuilder extends AbstractRequestBuilder {
  protected buildSpecific(): SpecificFields {
    return {
      requestText: "",
      responseText: "",
      render: (
        <Completion
          request={""}
          response={{
            title: "Error",
            text: "",
          }}
        />
      ),
    };
  }
}

export default UnknownBuilder;
