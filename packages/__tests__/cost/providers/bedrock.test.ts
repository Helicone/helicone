import { BedrockProvider } from "../../../cost/models/providers/bedrock";

describe("BedrockProvider", () => {
  const provider = new BedrockProvider();

  describe("buildUrl", () => {
    it("should build invoke URL for non-streaming requests", () => {
      const url = provider.buildUrl(
        {
          providerModelId: "anthropic.claude-3-haiku-20240307-v1:0",
          modelConfig: { providerModelId: "anthropic.claude-3-haiku-20240307-v1:0" },
          userConfig: { region: "us-east-1" },
        } as any,
        { isStreaming: false }
      );

      expect(url).toBe(
        "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-haiku-20240307-v1:0/invoke"
      );
    });

    it("should build invoke-with-response-stream URL for streaming requests", () => {
      const url = provider.buildUrl(
        {
          providerModelId: "anthropic.claude-3-haiku-20240307-v1:0",
          modelConfig: { providerModelId: "anthropic.claude-3-haiku-20240307-v1:0" },
          userConfig: { region: "us-west-2" },
        } as any,
        { isStreaming: true }
      );

      expect(url).toBe(
        "https://bedrock-runtime.us-west-2.amazonaws.com/model/anthropic.claude-3-haiku-20240307-v1:0/invoke-with-response-stream"
      );
    });

    it("should add region prefix for cross-region requests", () => {
      const url = provider.buildUrl(
        {
          providerModelId: "anthropic.claude-3-haiku-20240307-v1:0",
          modelConfig: { providerModelId: "anthropic.claude-3-haiku-20240307-v1:0" },
          userConfig: { region: "us-east-1", crossRegion: true },
        } as any,
        { isStreaming: false }
      );

      expect(url).toBe(
        "https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-3-haiku-20240307-v1:0/invoke"
      );
    });

    it("should default to us-east-1 region when not specified", () => {
      const url = provider.buildUrl(
        {
          providerModelId: "anthropic.claude-3-haiku-20240307-v1:0",
          modelConfig: { providerModelId: "anthropic.claude-3-haiku-20240307-v1:0" },
          userConfig: {},
        } as any,
        { isStreaming: false }
      );

      expect(url).toBe(
        "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-haiku-20240307-v1:0/invoke"
      );
    });
  });

  describe("authenticate", () => {
    it("should throw error when apiKey is missing", async () => {
      await expect(
        provider.authenticate(
          { secretKey: "test-secret-key" },
          { providerModelId: "claude-3-haiku", userConfig: { region: "us-east-1" } } as any
        )
      ).rejects.toThrow("Bedrock requires both apiKey and secretKey");
    });

    it("should throw error when secretKey is missing", async () => {
      await expect(
        provider.authenticate(
          { apiKey: "test-access-key" },
          { providerModelId: "claude-3-haiku", userConfig: { region: "us-east-1" } } as any
        )
      ).rejects.toThrow("Bedrock requires both apiKey and secretKey");
    });

    it("should throw error when requestMethod is missing", async () => {
      await expect(
        provider.authenticate(
          {
            apiKey: "test-access-key",
            secretKey: "test-secret-key",
            requestUrl: "https://test.com",
            requestBody: "{}"
          },
          { providerModelId: "claude-3-haiku", userConfig: { region: "us-east-1" } } as any
        )
      ).rejects.toThrow("Bedrock authentication requires requestMethod, requestUrl, and requestBody");
    });
  });

  describe("buildRequestBody", () => {
    it("should add anthropic_version for Claude models with OPENAI mapping", () => {
      const body = provider.buildRequestBody(
        { providerModelId: "anthropic.claude-3-haiku-20240307-v1:0" } as any,
        {
          bodyMapping: "OPENAI",
          toAnthropic: (body: any) => ({ ...body, converted: true }),
          parsedBody: {
            model: "claude-3-haiku",
            messages: [{ role: "user", content: "Test" }]
          }
        } as any
      );

      const parsed = JSON.parse(body);
      expect(parsed.anthropic_version).toBe("bedrock-2023-05-31");
      expect(parsed.converted).toBe(true);
      expect(parsed.model).toBeUndefined();
      expect(parsed.stream).toBeUndefined();
    });

    it("should handle Claude models without OPENAI mapping", () => {
      const body = provider.buildRequestBody(
        { providerModelId: "anthropic.claude-3-5-sonnet-20241022-v1:0" } as any,
        {
          bodyMapping: "NO_MAPPING",
          parsedBody: {
            messages: [{ role: "user", content: "Hello" }],
            max_tokens: 1024
          }
        } as any
      );

      const parsed = JSON.parse(body);
      expect(parsed.anthropic_version).toBe("bedrock-2023-05-31");
      expect(parsed.messages).toEqual([{ role: "user", content: "Hello" }]);
      expect(parsed.max_tokens).toBe(1024);
      expect(parsed.model).toBeUndefined();
      expect(parsed.stream).toBeUndefined();
    });
  });

  describe("provider metadata", () => {
    it("should have correct display name", () => {
      expect(provider.displayName).toBe("AWS Bedrock");
    });

    it("should have correct auth type", () => {
      expect(provider.auth).toBe("aws-signature");
    });

    it("should have correct required config", () => {
      expect(provider.requiredConfig).toEqual(["region"]);
    });

    it("should have correct base URL template", () => {
      expect(provider.baseUrl).toBe("https://bedrock-runtime.{region}.amazonaws.com");
    });
  });
});
