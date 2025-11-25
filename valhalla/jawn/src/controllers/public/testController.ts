import { Body, Controller, Post, Route, Security, Tags } from "tsoa";

export interface SendTestRequestRequest {
  apiKey: string;
}

export interface SendTestRequestResponse {
  success: boolean;
  response?: string;
  requestId?: string;
  error?: string;
}

@Security("api_key")
@Tags("Test")
@Route("v1/test")
export class TestController extends Controller {
  @Post("/gateway-request")
  public async sendTestRequest(
    @Body() body: SendTestRequestRequest
  ): Promise<SendTestRequestResponse> {
    try {
      // Determine gateway URL based on environment
      const gatewayUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:8793"
          : "https://ai-gateway.helicone.ai";

      // Make test request to AI Gateway
      const response = await fetch(`${gatewayUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${body.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Say hello!" }],
        }),
      });

      // Extract request ID from headers
      const requestId = response.headers.get("helicone-id") || undefined;

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Request failed";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorText;
        } catch {
          errorMessage = errorText;
        }

        return {
          success: false,
          error: errorMessage,
          requestId,
        };
      }

      // Parse response
      const data = await response.json();
      const messageContent =
        data.choices?.[0]?.message?.content || "No response content";

      return {
        success: true,
        response: messageContent,
        requestId,
      };
    } catch (error) {
      console.error("Test request error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
