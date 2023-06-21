import { HeliconeRequest } from "../../../../lib/api/request/request";
import AbstractRequestBuilder from "./abstractRequestBuilder";
import ChatGPTBuilder from "./ChatGPTBuilder";
import GPT3Builder from "./GPT3Builder";

type requestBuilderModels =
  | "default-openai"
  | "text-davinci-003"
  | "gpt-3.5-turbo"
  | "gpt-4";

let requestBuilders: {
  [key in requestBuilderModels]: new (
    request: HeliconeRequest
  ) => AbstractRequestBuilder;
} = {
  // default case is a GPT-3 completion
  "default-openai": GPT3Builder,
  "text-davinci-003": GPT3Builder,
  "gpt-3.5-turbo": ChatGPTBuilder,
  "gpt-4": ChatGPTBuilder,
};

const getRequestBuilder = (request: HeliconeRequest) => {
  let requestModel = request.request_body.model || request.response_body.model;

  if (Object.keys(requestBuilders).indexOf(requestModel) === -1) {
    requestModel = "default-openai";
  }
  let Builder = requestBuilders[requestModel as requestBuilderModels];
  let builder = new Builder(request);
  return builder;
};

export default getRequestBuilder;
