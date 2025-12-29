import { toOpenAI } from "@helicone-package/llm-mapper/transform/providers/google/response/toOpenai";
import { GoogleResponseBody } from "@helicone-package/llm-mapper/transform/types/google";

export async function goog2oaiResponse(response: Response): Promise<Response> {
  try {
    const googleBody = await response.json<GoogleResponseBody>();
    const openAIBody = toOpenAI(googleBody);

    return new Response(JSON.stringify(openAIBody), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type": "application/json",
        ...Object.fromEntries(response.headers.entries()),
      },
    });
  } catch (error) {
    console.error("Failed to transform Google response:", error);
    return response;
  }
}
