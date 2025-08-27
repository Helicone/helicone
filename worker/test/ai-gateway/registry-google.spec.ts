import { SELF, fetchMock } from "cloudflare:test";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from "vitest";
import "../setup";

function mockRequiredServices() {
  const s3Mock = fetchMock
    .get("http://localhost:9000")
    .intercept({
      path: /.*/,
      method: "PUT",
    })
    .reply(() => ({
      statusCode: 200,
      data: "",
    }))
    .persist();

  const loggingMock = fetchMock
    .get("http://localhost:8585")
    .intercept({
      path: "/v1/log/request",
      method: "POST",
    })
    .reply(() => ({
      statusCode: 200,
      data: { success: true },
    }))
    .persist();

  return { s3Mock, loggingMock };
}

describe("Google Registry Tests", () => {
  beforeAll(() => {
    fetchMock.activate();
    fetchMock.disableNetConnect();
    mockRequiredServices();
  });

  afterAll(() => {
    fetchMock.deactivate();
  });

  describe("BYOK Tests - Google Gemini Models", () => {
    // Note: Google models only have the 'google' provider, no vertex/bedrock
    
    // Gemini 2.5 Flash Tests
    describe("gemini-2.5-flash", () => {
      it("should handle google provider", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-flash:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Flash" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-flash/google",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select google provider when none specified", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-flash:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Flash" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-flash", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Gemini 2.5 Flash Lite Tests
    describe("gemini-2.5-flash-lite", () => {
      it("should handle google provider", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-flash-lite:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Flash Lite" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-flash-lite/google",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select google provider when none specified", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-flash-lite:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Flash Lite" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 10,
                candidatesTokenCount: 5,
                totalTokenCount: 15,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-flash-lite", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Gemini 2.5 Pro Tests
    describe("gemini-2.5-pro", () => {
      it("should handle google provider", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-pro:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Pro" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 20,
                candidatesTokenCount: 10,
                totalTokenCount: 30,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-pro/google",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select google provider when none specified", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-pro:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Pro" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 20,
                candidatesTokenCount: 10,
                totalTokenCount: 30,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-pro", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Gemini 2.5 Pro Preview Tests
    describe("gemini-2.5-pro-preview", () => {
      it("should handle google provider", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-pro-preview:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Pro Preview" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 20,
                candidatesTokenCount: 10,
                totalTokenCount: 30,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-pro-preview/google",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select google provider when none specified", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-pro-preview:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Pro Preview" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 20,
                candidatesTokenCount: 10,
                totalTokenCount: 30,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-pro-preview", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Gemini 2.5 Pro Experimental Tests
    describe("gemini-2.5-pro-exp", () => {
      it("should handle google provider", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-pro-exp:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Pro Experimental" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 20,
                candidatesTokenCount: 10,
                totalTokenCount: 30,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-pro-exp/google",
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });

      it("should auto-select google provider when none specified", async () => {
        fetchMock
          .get("https://generativelanguage.googleapis.com")
          .intercept({ 
            path: "/v1beta/models/gemini-2.5-pro-exp:generateContent",
            method: "POST" 
          })
          .reply(() => ({
            statusCode: 200,
            data: {
              candidates: [{
                content: {
                  parts: [{ text: "Test response from Gemini 2.5 Pro Experimental" }],
                  role: "model",
                },
                finishReason: "STOP",
                safetyRatings: [],
                citationMetadata: { citationSources: [] },
              }],
              promptFeedback: {
                safetyRatings: [],
              },
              usageMetadata: {
                promptTokenCount: 20,
                candidatesTokenCount: 10,
                totalTokenCount: 30,
              },
            },
          }))
          .persist();

        const response = await SELF.fetch(
          "https://ai-gateway.helicone.ai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer sk-helicone-test",
            },
            body: JSON.stringify({
              model: "gemini-2.5-pro-exp", // No provider specified
              messages: [{ role: "user", content: "Test" }],
              max_tokens: 100,
            }),
          }
        );

        expect(response.status).toBe(200);
      });
    });

    // Note: Since Google models only have one provider, fallback tests aren't needed
    // as there's nothing to fallback to
  });
});