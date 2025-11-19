import { VertexProvider } from "../../../cost/models/providers/vertex";
import { getGoogleAccessToken } from "../../../cost/auth/gcpServiceAccountAuth";

// Mock the getGoogleAccessToken function
jest.mock("../../../cost/auth/gcpServiceAccountAuth");

describe("VertexProvider", () => {
  const provider = new VertexProvider();
  const mockedGetGoogleAccessToken = jest.mocked(getGoogleAccessToken);

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetGoogleAccessToken.mockResolvedValue("test-access-token");
  });

  describe("buildUrl", () => {
    describe("Gemini models", () => {
      it("should build Gemini generateContent URL for Gemini models", () => {
        const url = provider.buildUrl(
          {
            providerModelId: "gemini-1.5-pro",
            author: "google",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "test-project", region: "us-central1" },
          } as any,
          { isStreaming: false }
        );

        expect(url).toBe(
          "https://us-central1-aiplatform.googleapis.com/v1beta1/projects/test-project/locations/us-central1/publishers/google/models/gemini-1.5-pro:generateContent"
        );
      });

      it("should build streamGenerateContent URL for streaming Gemini models", () => {
        const nonStreamingUrl = provider.buildUrl(
          {
            providerModelId: "gemini-1.5-flash",
            author: "google",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "test-project", region: "eu-west1" },
          } as any,
          { isStreaming: false }
        );

        const streamingUrl = provider.buildUrl(
          {
            providerModelId: "gemini-1.5-flash",
            author: "google",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "test-project", region: "eu-west1" },
          } as any,
          { isStreaming: true }
        );

        expect(nonStreamingUrl).toBe(
          "https://eu-west1-aiplatform.googleapis.com/v1beta1/projects/test-project/locations/eu-west1/publishers/google/models/gemini-1.5-flash:generateContent"
        );
        expect(streamingUrl).toBe(
          "https://eu-west1-aiplatform.googleapis.com/v1beta1/projects/test-project/locations/eu-west1/publishers/google/models/gemini-1.5-flash:streamGenerateContent?alt=sse"
        );
      });

      it("should throw error when projectId is missing for Gemini models", () => {
        expect(() =>
          provider.buildUrl(
            {
              providerModelId: "gemini-1.5-pro",
              author: "google",
              modelConfig: { crossRegion: false } as any,
              userConfig: { region: "us-central1" },
            } as any,
            { isStreaming: false }
          )
        ).toThrow("Vertex AI requires projectId in config for Gemini models");
      });

      it("should handle case-insensitive Gemini model detection", () => {
        const url = provider.buildUrl(
          {
            providerModelId: "GEMINI-1.5-PRO",
            author: "google",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "test-project", region: "us-central1" },
          } as any,
          { isStreaming: false }
        );

        expect(url).toBe(
          "https://us-central1-aiplatform.googleapis.com/v1beta1/projects/test-project/locations/us-central1/publishers/google/models/GEMINI-1.5-PRO:generateContent"
        );
      });
    });

    describe("Claude/Anthropic models", () => {
      it("should build rawPredict URL for non-streaming Claude models", () => {
        const url = provider.buildUrl(
          {
            providerModelId: "claude-3-5-haiku@20241022",
            author: "anthropic",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "test-project", region: "us-central1" },
          } as any,
          { isStreaming: false }
        );

        expect(url).toBe(
          "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-haiku@20241022:rawPredict"
        );
      });

      it("should build streamRawPredict URL for streaming Claude models", () => {
        const url = provider.buildUrl(
          {
            providerModelId: "claude-3-5-sonnet@20241022",
            author: "anthropic",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "test-project", region: "us-central1" },
          } as any,
          { isStreaming: true }
        );

        expect(url).toBe(
          "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-5-sonnet@20241022:streamRawPredict"
        );
      });

      it("should handle different regions for Claude models", () => {
        const url = provider.buildUrl(
          {
            providerModelId: "claude-3-opus@20240229",
            author: "anthropic",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "my-project", region: "europe-west1" },
          } as any,
          { isStreaming: false }
        );

        expect(url).toBe(
          "https://europe-west1-aiplatform.googleapis.com/v1/projects/my-project/locations/europe-west1/publishers/anthropic/models/claude-3-opus@20240229:rawPredict"
        );
      });

      it("should throw error when projectId is missing for non-Gemini models", () => {
        expect(() =>
          provider.buildUrl(
            {
              providerModelId: "claude-3-5-haiku",
              author: "anthropic",
              modelConfig: { crossRegion: false } as any,
              userConfig: { region: "us-central1" },
            } as any,
            { isStreaming: false }
          )
        ).toThrow("Vertex AI requires projectId and region in config for non-Gemini models");
      });

      it("should default author to anthropic if not provided", () => {
        const url = provider.buildUrl(
          {
            providerModelId: "claude-3-haiku",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "test-project", region: "us-central1" },
          } as any,
          { isStreaming: false }
        );

        expect(url).toBe(
          "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3-haiku:rawPredict"
        );
      });
    });

    describe("Default region handling", () => {
      it("should use us-central1 as default region for Gemini models", () => {
        const url = provider.buildUrl(
          {
            providerModelId: "gemini-pro",
            author: "google",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "test-project" },
          } as any,
          { isStreaming: false }
        );

        expect(url).toBe(
          "https://us-central1-aiplatform.googleapis.com/v1beta1/projects/test-project/locations/us-central1/publishers/google/models/gemini-pro:generateContent"
        );
      });

      it("should use us-central1 as default region for Claude models", () => {
        const url = provider.buildUrl(
          {
            providerModelId: "claude-3",
            author: "anthropic",
            modelConfig: { crossRegion: false } as any,
            userConfig: { projectId: "test-project" },
          } as any,
          { isStreaming: false }
        );

        expect(url).toBe(
          "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/claude-3:rawPredict"
        );
      });
    });
  });

  describe("buildRequestBody", () => {
    describe("Gemini models", () => {
      it("should map chat completions body to Gemini format", () => {
        const body = provider.buildRequestBody(
          { providerModelId: "gemini-1.5-pro" } as any,
          {
            parsedBody: {
              model: "gemini-1.5-pro",
              messages: [{ role: "user", content: "Hello" }],
              temperature: 0.5,
              max_tokens: 1024,
            },
          } as any
        );

        const parsed = JSON.parse(body);
        expect(parsed.contents).toEqual([
          {
            role: "user",
            parts: [{ text: "Hello" }],
          },
        ]);
        expect(parsed.generationConfig).toEqual({
          temperature: 0.5,
          maxOutputTokens: 1024,
        });
      });

      it("should handle case-insensitive Gemini detection in buildRequestBody", () => {
        const body = provider.buildRequestBody(
          { providerModelId: "GEMINI-1.5-FLASH" } as any,
          {
            parsedBody: {
              model: "GEMINI-1.5-FLASH",
              messages: [{ role: "user", content: "Hi" }],
              temperature: 0.7,
            },
          } as any
        );

        const parsed = JSON.parse(body);
        expect(parsed.contents[0].parts[0].text).toBe("Hi");
        expect(parsed.generationConfig.temperature).toBe(0.7);
      });
    });

    describe("Claude/Anthropic models", () => {
      it("should add anthropic_version for Claude models with OPENAI mapping", () => {
        const body = provider.buildRequestBody(
          { providerModelId: "claude-3-haiku", author: "anthropic" } as any,
          {
            bodyMapping: "OPENAI",
            toAnthropic: (body: any) => ({ ...body, anthropic_content: true }),
            parsedBody: {
              model: "claude-3-haiku",
              messages: [{ role: "user", content: "Test" }]
            }
          } as any
        );

        const parsed = JSON.parse(body);
        expect(parsed.anthropic_version).toBe("vertex-2023-10-16");
        expect(parsed.anthropic_content).toBe(true);
      });

      it("should not transform body for Claude models without OPENAI mapping", () => {
        const body = provider.buildRequestBody(
          { providerModelId: "claude-3-sonnet", author: "anthropic" } as any,
          {
            bodyMapping: "NO_MAPPING",
            toAnthropic: (body: any) => ({ ...body, should_not_appear: true }),
            parsedBody: {
              model: "claude-3-sonnet",
              messages: [{ role: "user", content: "Test" }]
            }
          } as any
        );

        const parsed = JSON.parse(body);
        expect(parsed.anthropic_version).toBe("vertex-2023-10-16");
        expect(parsed.should_not_appear).toBeUndefined();
      });
    });

    describe("Other models", () => {
      it("should pass through body unchanged for non-Gemini/non-Anthropic models", () => {
        const body = provider.buildRequestBody(
          { providerModelId: "some-other-model", author: "other" } as any,
          {
            parsedBody: {
              model: "some-other-model",
              custom_field: "custom_value"
            }
          } as any
        );

        const parsed = JSON.parse(body);
        expect(parsed.model).toBe("some-other-model");
        expect(parsed.custom_field).toBe("custom_value");
      });
    });
  });

  describe("authenticate", () => {
    it("should return Bearer token with Google access token", async () => {
      const result = await provider.authenticate(
        { apiKey: '{"type":"service_account"}', orgId: "test-org" },
        {} as any,
        undefined
      );

      expect(getGoogleAccessToken).toHaveBeenCalledWith(
        '{"type":"service_account"}',
        "test-org",
        ["https://www.googleapis.com/auth/cloud-platform"],
        undefined
      );
      expect(result.headers.Authorization).toBe("Bearer test-access-token");
    });

    it("should throw error when service account JSON is missing", async () => {
      await expect(
        provider.authenticate(
          { orgId: "test-org" },
          {} as any,
          undefined
        )
      ).rejects.toThrow("Service account JSON is required for Vertex AI authentication");
    });

    it("should pass cache provider to getGoogleAccessToken", async () => {
      const mockCacheProvider = { get: jest.fn(), set: jest.fn() };

      await provider.authenticate(
        { apiKey: '{"type":"service_account"}', orgId: "test-org" },
        {} as any,
        mockCacheProvider as any
      );

      expect(getGoogleAccessToken).toHaveBeenCalledWith(
        '{"type":"service_account"}',
        "test-org",
        ["https://www.googleapis.com/auth/cloud-platform"],
        mockCacheProvider
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle empty model ID", () => {
      // Empty model ID doesn't match "gemini", so it's treated as non-Gemini and builds a URL
      const url = provider.buildUrl(
        {
          providerModelId: "",
          modelConfig: { crossRegion: false } as any,
          userConfig: { projectId: "test-project", region: "us-central1" },
        } as any,
        { isStreaming: false }
      );

      expect(url).toBe(
        "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/:rawPredict"
      );
    });

    it("should handle undefined model ID", () => {
      // Undefined model ID doesn't match "gemini", so it's treated as non-Gemini and builds a URL
      const url = provider.buildUrl(
        {
          modelConfig: { crossRegion: false } as any,
          userConfig: { projectId: "test-project", region: "us-central1" },
        } as any,
        { isStreaming: false }
      );

      expect(url).toBe(
        "https://us-central1-aiplatform.googleapis.com/v1/projects/test-project/locations/us-central1/publishers/anthropic/models/:rawPredict"
      );
    });

    it("should handle special characters in project ID", () => {
      const url = provider.buildUrl(
        {
          providerModelId: "gemini-pro",
          author: "google",
          modelConfig: { crossRegion: false } as any,
          userConfig: { projectId: "my-project-123", region: "us-central1" },
        } as any,
        { isStreaming: false }
      );

      expect(url).toBe(
        "https://us-central1-aiplatform.googleapis.com/v1beta1/projects/my-project-123/locations/us-central1/publishers/google/models/gemini-pro:generateContent"
      );
    });
  });
});
