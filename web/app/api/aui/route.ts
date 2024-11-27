import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createEdgeRuntimeAPI } from "@assistant-ui/react/edge";

export const maxDuration = 30;
export const runtime = "edge";

export const { POST } = createEdgeRuntimeAPI({
  model: async ({ apiKey, modelName }) => {
    if (!modelName) throw new Error("modelName is required");

    if (modelName.startsWith("gpt-") || modelName.startsWith("ft:gpt-")) {
      return createOpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY })(
        modelName
      );
    } else {
      return createAnthropic({
        apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      })(modelName);
    }
  },
});
