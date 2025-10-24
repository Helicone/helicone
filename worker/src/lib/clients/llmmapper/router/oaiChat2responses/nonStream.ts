import { OpenAIResponseBody } from "@helicone-package/llm-mapper/transform/types/openai";
import { toResponses } from "@helicone-package/llm-mapper/transform/providers/responses/openai/response/toResponses";

/**
 * Convert an OpenAI Chat Completions JSON Response object into
 * an OpenAI Responses API JSON Response object.
 */
export async function oaiChat2responsesResponse(response: Response): Promise<Response> {
  try {
    const bodyText = await response.text();
    const oaiBody = JSON.parse(bodyText) as OpenAIResponseBody;
    const responsesBody = toResponses(oaiBody);

    return new Response(JSON.stringify(responsesBody), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "content-type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to transform Chat->Responses response:", error);
    return response;
  }
}

