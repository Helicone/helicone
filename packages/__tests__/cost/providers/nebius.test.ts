import { describe, expect, it } from "@jest/globals";
import { registry } from "../../../cost/models/registry";
import {
  buildEndpointUrl,
  buildRequestBody,
} from "../../../cost/models/provider-helpers";
import { NebiusProvider } from "../../../cost/models/providers/nebius";

describe("Nebius Token Factory provider", () => {
  const provider = new NebiusProvider();

  it("routes AI Gateway requests to Chat Completions", () => {
    const config = registry.getModelProviderConfig(
      "llama-3.3-70b-instruct",
      "nebius",
    );
    expect(config.data).toBeDefined();

    const endpoint = registry.buildEndpoint(config.data!, {});
    expect(endpoint.data).toBeDefined();

    const result = buildEndpointUrl(endpoint.data!, {
      bodyMapping: "OPENAI",
    });

    expect(result.data).toBe(
      "https://api.tokenfactory.nebius.com/v1/chat/completions",
    );
  });

  it("uses the current Token Factory model ID and public pricing", async () => {
    const config = registry.getModelProviderConfig(
      "llama-3.3-70b-instruct",
      "nebius",
    );
    expect(config.data).toBeDefined();
    expect(config.data?.providerModelId).toBe(
      "meta-llama/Llama-3.3-70B-Instruct",
    );
    expect(config.data?.pricing).toEqual([
      {
        threshold: 0,
        input: 0.00000013,
        output: 0.0000004,
      },
    ]);

    const endpoint = registry.buildEndpoint(config.data!, {});
    expect(endpoint.data).toBeDefined();

    const result = await buildRequestBody(endpoint.data!, {
      parsedBody: {
        model: "llama-3.3-70b-instruct/nebius",
        messages: [{ role: "user", content: "Hello" }],
      },
      bodyMapping: "OPENAI",
      toAnthropic: (body: any) => body,
      toChatCompletions: (body: any) => body,
    });

    expect(result.error).toBeNull();
    expect(JSON.parse(result.data!)).toMatchObject({
      model: "meta-llama/Llama-3.3-70B-Instruct",
      messages: [{ role: "user", content: "Hello" }],
    });
  });

  it("returns a Token Factory detail error", async () => {
    const result = await provider.buildErrorMessage(
      new Response(JSON.stringify({ detail: "Invalid API key" }), {
        status: 401,
      }),
    );

    expect(result.message).toBe("Invalid API key");
  });

  it("returns an OpenAI-compatible nested error", async () => {
    const result = await provider.buildErrorMessage(
      new Response(
        JSON.stringify({ error: { message: "Model is not available" } }),
        { status: 404 },
      ),
    );

    expect(result.message).toBe("Model is not available");
  });

  it("falls back to the HTTP status for a malformed error", async () => {
    const result = await provider.buildErrorMessage(
      new Response("not-json", { status: 502 }),
    );

    expect(result.message).toBe("Request failed with status 502");
  });
});
