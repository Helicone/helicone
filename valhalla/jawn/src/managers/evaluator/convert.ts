import { TestInput } from "../../controllers/public/evaluatorController";
import { HeliconeRequest } from "../../packages/llm-mapper/types";

export const convertTestInputToHeliconeRequest = (
  testInput: TestInput
): HeliconeRequest => {
  return {
    asset_ids: [],
    asset_urls: {},
    helicone_user: null,
    provider: "OPENAI",
    model: "gpt-3.5-turbo",
    request_id: "",
    request_created_at: "",
    request_body: JSON.parse(testInput.inputBody),
    request_path: "",
    request_user_id: "",
    request_model: "",
    response_id: "",
    response_created_at: "",
    response_status: 200,
    response_model: "",
    response_body: JSON.parse(testInput.outputBody),
    request_properties: {},
    model_override: null,
    delay_ms: null,
    time_to_first_token: null,
    total_tokens: null,
    prompt_tokens: null,
    completion_tokens: null,
    prompt_id: null,
    llmSchema: null,
    country_code: null,
    scores: null,
    properties: {},
    assets: [],
    target_url: "",
  };
};
