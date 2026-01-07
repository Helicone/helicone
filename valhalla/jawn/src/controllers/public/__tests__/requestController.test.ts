import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { RequestController, RequestQueryParams } from "../requestController";
import { JawnAuthenticatedRequest } from "../../../types/request";
import { AuthParams } from "../../../packages/common/auth/types";
import { ok } from "../../../packages/common/result";
import { HeliconeRequest } from "@helicone-package/llm-mapper/types";

// Test configuration
const TEST_ORG_ID = "83635a30-5ba6-41a8-8cc6-fb7df941b24a";

// Mock authenticated request
const mockAuthParams: AuthParams = {
  organizationId: TEST_ORG_ID,
  userId: "test-user-id",
  role: "admin"
};

const mockRequest: JawnAuthenticatedRequest = {
  authParams: mockAuthParams,
} as JawnAuthenticatedRequest;

// Mock the RequestManager module
const sharedMockGetRequestsClickhouse = jest.fn();
jest.mock("../../../managers/request/RequestManager", () => ({
  RequestManager: jest.fn().mockImplementation(() => ({
    getRequestsClickhouse: sharedMockGetRequestsClickhouse,
  })),
}));

// Also mock ScoreManager to prevent importing heavy deps in controller module graph
jest.mock("../../../managers/score/ScoreManager", () => ({
  ScoreManager: jest.fn().mockImplementation(() => ({
    addScores: jest.fn(),
    addBatchScores: jest.fn(),
  })),
}));

// Helper to construct a fully-typed HeliconeRequest with sensible defaults
function makeHeliconeRequest(overrides: Partial<HeliconeRequest>): HeliconeRequest {
  return {
    response_id: null,
    response_created_at: null,
    response_body: {},
    response_status: 200,
    response_model: null,
    request_id: "req",
    request_created_at: new Date().toISOString(),
    request_body: {},
    request_path: "/v1/chat/completions",
    request_user_id: null,
    request_properties: {},
    request_model: null,
    model_override: null,
    helicone_user: null,
    provider: "OPENAI",
    delay_ms: 0,
    time_to_first_token: 0,
    total_tokens: 0,
    prompt_tokens: 0,
    prompt_cache_write_tokens: 0,
    prompt_cache_read_tokens: 0,
    completion_tokens: 0,
    reasoning_tokens: 0,
    prompt_audio_tokens: 0,
    completion_audio_tokens: 0,
    cost: 0,
    prompt_id: null,
    prompt_version: null,
    feedback_created_at: null,
    feedback_id: null,
    feedback_rating: null,
    signed_body_url: null,
    llmSchema: null,
    country_code: "US",
    asset_ids: [],
    asset_urls: {},
    scores: {},
    properties: {},
    assets: [],
    target_url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    cache_reference_id: null,
    cache_enabled: false,
    updated_at: new Date().toISOString(),
    ai_gateway_body_mapping: null,
    ...overrides,
  };
}

// Mock data for tests
const mockRequestData: HeliconeRequest[] = [
  makeHeliconeRequest({
    response_id: "80061a94-1ba5-43fe-8c81-f1db8c38e4a5",
    response_created_at: "2025-08-16 00:31:37.805",
    response_status: 400,
    completion_tokens: 0,
    model: "gpt-4o-mini",
    request_id: "06a3e048-2407-4e88-851f-5a7890dda2c9",
    request_created_at: "2025-08-16 00:31:37.520",
    prompt_tokens: 0,
    provider: "OPENAI",
    target_url: "https://api.openai.com/v1/completions",
    properties: {},
    scores: { "helicone-score-feedback": 1 },
    request_body: "Hello, how are you?user",
    response_body: "",
    cost: 0,
  }),
  makeHeliconeRequest({
    response_id: "542abcb8-c0d2-48fd-bdf8-c4ea81532ac7",
    response_created_at: "2025-08-16 20:44:25.610",
    response_status: 200,
    completion_tokens: 30,
    model: "gpt-4o-mini-2024-07-18",
    request_id: "fac84b2d-fd86-4ee8-b246-08ba0c7ddab3",
    request_created_at: "2025-08-16 20:44:24.110",
    prompt_tokens: 13,
    provider: "OPENAI",
    target_url: "https://api.openai.com/v1/chat/completions",
    properties: {},
    scores: { "helicone-score-feedback": 1 },
    request_body: "Hello, how are you?user",
    response_body: "Hello! I'm just a computer program, so I don't have feelings, but I'm here and ready to help you. How can I assist you today?assistant",
    cost: 19950,
  }),
  makeHeliconeRequest({
    response_id: "test-no-feedback-1",
    response_created_at: "2025-08-17 10:00:00.000",
    response_status: 200,
    completion_tokens: 20,
    model: "gpt-3.5-turbo",
    request_id: "test-request-no-feedback-1",
    request_created_at: "2025-08-17 09:59:59.500",
    prompt_tokens: 10,
    provider: "OPENAI",
    target_url: "https://api.openai.com/v1/chat/completions",
    properties: {},
    scores: {},
    request_body: "Test message",
    response_body: "Test response",
    cost: 10000,
  }),
  makeHeliconeRequest({
    response_id: "test-negative-feedback-1",
    response_created_at: "2025-08-17 11:00:00.000",
    response_status: 200,
    completion_tokens: 25,
    model: "gpt-3.5-turbo",
    request_id: "test-request-negative-feedback-1",
    request_created_at: "2025-08-17 10:59:59.400",
    prompt_tokens: 12,
    provider: "OPENAI",
    target_url: "https://api.openai.com/v1/chat/completions",
    properties: {},
    scores: { "helicone-score-feedback": 0 },
    request_body: "Another test",
    response_body: "Another response",
    cost: 12000,
  }),
];

describe("RequestController - Unit Tests", () => {
  let controller: RequestController;
  let mockGetRequestsClickhouse: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new controller instance
    controller = new RequestController();
    
    // Get the mocked RequestManager
    sharedMockGetRequestsClickhouse.mockReset();
    mockGetRequestsClickhouse = sharedMockGetRequestsClickhouse;
  });

  describe("getRequestsClickhouse - Unit Tests", () => {
    test("should filter requests with positive feedback", async () => {
      // Set up mock to return filtered data
      const expectedData = mockRequestData.filter(
        r => r.scores?.["helicone-score-feedback"] === 1
      );
      mockGetRequestsClickhouse.mockResolvedValue(ok(expectedData));

      const requestBody: RequestQueryParams = {
        filter: {
          request_response_rmt: {
            "helicone-score-feedback": {
              equals: true,
            },
          },
        },
        offset: 0,
        limit: 25,
        sort: {
          created_at: "desc",
        },
        isCached: false,
      };

      const result = await controller.getRequestsClickhouse(requestBody, mockRequest);

      // Verify the controller called the manager with the correct params
      expect(mockGetRequestsClickhouse).toHaveBeenCalledWith(requestBody);

      // Verify the result
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      
      const expectedIds = [
        "06a3e048-2407-4e88-851f-5a7890dda2c9",
        "fac84b2d-fd86-4ee8-b246-08ba0c7ddab3",
      ];
      const actualIds = result.data?.map((r: any) => r.request_id) || [];
      expect(actualIds.sort()).toEqual(expectedIds.sort());
    });

    test("should filter requests with negative feedback", async () => {
      // Set up mock to return filtered data
      const expectedData = mockRequestData.filter(
        r => r.scores?.["helicone-score-feedback"] === 0
      );
      mockGetRequestsClickhouse.mockResolvedValue(ok(expectedData));

      const requestBody: RequestQueryParams = {
        filter: {
          request_response_rmt: {
            "helicone-score-feedback": {
              equals: false,
            },
          },
        },
        offset: 0,
        limit: 25,
        sort: {
          created_at: "desc",
        },
        isCached: false,
      };

      const result = await controller.getRequestsClickhouse(requestBody, mockRequest);

      expect(mockGetRequestsClickhouse).toHaveBeenCalledWith(requestBody);
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      
      const expectedIds = ["test-request-negative-feedback-1"];
      const actualIds = result.data?.map((r: any) => r.request_id) || [];
      expect(actualIds).toEqual(expectedIds);
    });

    test("should handle empty results when no requests match filter", async () => {
      // Set up mock to return empty array
      mockGetRequestsClickhouse.mockResolvedValue(ok([]));

      const requestBody: RequestQueryParams = {
        filter: {
          request_response_rmt: {
            "helicone-score-feedback": {
              equals: true,
            },
          },
        },
        offset: 0,
        limit: 25,
        sort: {
          created_at: "desc",
        },
        isCached: false,
      };

      const result = await controller.getRequestsClickhouse(requestBody, mockRequest);

      expect(mockGetRequestsClickhouse).toHaveBeenCalledWith(requestBody);
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(0);
    });

    test("should combine feedback filter with model filter", async () => {
      // Set up mock to return filtered data
      const expectedData = mockRequestData.filter(
        r => r.scores?.["helicone-score-feedback"] === 1 && r.model === "gpt-4o-mini"
      );
      mockGetRequestsClickhouse.mockResolvedValue(ok(expectedData));

      const requestBody: RequestQueryParams = {
        filter: {
          left: {
            request_response_rmt: {
              "helicone-score-feedback": {
                equals: true,
              },
            },
          },
          right: {
            request_response_rmt: {
              model: {
                equals: "gpt-4o-mini",
              },
            },
          },
          operator: "and",
        },
        offset: 0,
        limit: 25,
        sort: {
          created_at: "desc",
        },
        isCached: false,
      };

      const result = await controller.getRequestsClickhouse(requestBody, mockRequest);

      expect(mockGetRequestsClickhouse).toHaveBeenCalledWith(requestBody);
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0]?.request_id).toBe("06a3e048-2407-4e88-851f-5a7890dda2c9");
    });

    test("should handle OR operator with feedback filter", async () => {
      // Set up mock to return data matching either condition
      const expectedData = mockRequestData.filter(
        r => r.scores?.["helicone-score-feedback"] === 1 || r.model === "gpt-3.5-turbo"
      );
      mockGetRequestsClickhouse.mockResolvedValue(ok(expectedData));

      const requestBody: RequestQueryParams = {
        filter: {
          left: {
            request_response_rmt: {
              "helicone-score-feedback": {
                equals: true,
              },
            },
          },
          right: {
            request_response_rmt: {
              model: {
                equals: "gpt-3.5-turbo",
              },
            },
          },
          operator: "or",
        },
        offset: 0,
        limit: 25,
        sort: {
          created_at: "desc",
        },
        isCached: false,
      };

      const result = await controller.getRequestsClickhouse(requestBody, mockRequest);

      expect(mockGetRequestsClickhouse).toHaveBeenCalledWith(requestBody);
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      
      const requestIds = result.data?.map((r: any) => r.request_id) || [];
      expect(requestIds).toContain("06a3e048-2407-4e88-851f-5a7890dda2c9"); // has feedback
      expect(requestIds).toContain("fac84b2d-fd86-4ee8-b246-08ba0c7ddab3"); // has feedback
      expect(requestIds).toContain("test-request-no-feedback-1"); // has gpt-3.5-turbo
      expect(requestIds).toContain("test-request-negative-feedback-1"); // has gpt-3.5-turbo
    });

    test("should handle pagination", async () => {
      // First page
      const firstPageData = [mockRequestData[0]];
      mockGetRequestsClickhouse.mockResolvedValueOnce(ok(firstPageData));

      const firstPageRequest: RequestQueryParams = {
        filter: {
          request_response_rmt: {
            "helicone-score-feedback": {
              equals: true,
            },
          },
        },
        offset: 0,
        limit: 1,
        sort: {
          created_at: "desc",
        },
        isCached: false,
      };

      const firstResult = await controller.getRequestsClickhouse(firstPageRequest, mockRequest);
      expect(firstResult.data?.length).toBe(1);

      // Second page
      const secondPageData = [mockRequestData[1]];
      mockGetRequestsClickhouse.mockResolvedValueOnce(ok(secondPageData));

      const secondPageRequest: RequestQueryParams = {
        ...firstPageRequest,
        offset: 1,
      };

      const secondResult = await controller.getRequestsClickhouse(secondPageRequest, mockRequest);
      expect(secondResult.data?.length).toBe(1);
      
      // Ensure different results
      expect(firstResult.data?.[0]?.request_id).not.toBe(secondResult.data?.[0]?.request_id);
    });
  });
});