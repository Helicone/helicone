import { describe, expect, it } from "@jest/globals";
import {
  getMapperType,
  getMapperTypeFromHeliconeRequest,
} from "../../llm-mapper/utils/getMapperType";
import { HeliconeRequest } from "../../llm-mapper/types";

describe("getMapperType", () => {
  it("should detect standard Gemini models", () => {
    const result = getMapperType({
      model: "gemini-1.5-pro",
      provider: "GOOGLE",
    });

    expect(result).toBe("gemini-chat");
  });

  it("should detect Gemini models with unknown model name when provider is GOOGLE", () => {
    const result = getMapperType({
      model: "unknown",
      provider: "GOOGLE",
    });

    expect(result).toBe("gemini-chat");
  });

  it("should detect any Google provider models as Gemini chat", () => {
    const result = getMapperType({
      model: "some-future-google-model",
      provider: "GOOGLE",
    });

    expect(result).toBe("gemini-chat");
  });

  it("should use openai-chat for model with gemini in name but OpenAI provider", () => {
    const result = getMapperType({
      model: "custom-gemini-model",
      provider: "OPENAI",
    });

    expect(result).toBe("openai-chat");
  });
});

// Test a subset of the getMapperTypeFromHeliconeRequest functionality
describe("getMapperTypeFromHeliconeRequest", () => {
  it("should detect Gemini requests with unknown model", () => {
    const heliconeRequest: HeliconeRequest = {
      request_id: "test-id",
      request_path: "/v1/models/gemini-pro:generateContent",
      request_body: {},
      response_body: {
        modelVersion: "gemini-2.0-flash",
      },
      provider: "GOOGLE",
      model: "unknown",
      request_created_at: new Date().toISOString(),
      request_user_id: "test-user",
      response_id: null,
      response_created_at: null,
      response_status: 200,
      response_model: null,
      request_properties: null,
      request_model: null,
      model_override: null,
      helicone_user: null,
      delay_ms: null,
      time_to_first_token: null,
      total_tokens: null,
      prompt_tokens: null,
      prompt_cache_write_tokens: null,
      prompt_cache_read_tokens: null,
      completion_tokens: null,
      prompt_id: null,
      llmSchema: null,
      country_code: null,
      asset_ids: null,
      asset_urls: null,
      scores: null,
      properties: {},
      assets: [],
      target_url: "/v1/models/gemini-pro:generateContent",
    };

    const result = getMapperTypeFromHeliconeRequest(heliconeRequest, "unknown");
    expect(result).toBe("gemini-chat");
  });
});
