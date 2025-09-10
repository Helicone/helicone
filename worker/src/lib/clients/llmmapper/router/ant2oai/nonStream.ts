import { toOpenAI } from "../../providers/anthropic/response/toOpenai";
import { AntResponseBody } from "../../providers/anthropic/response/types";

export async function ant2oaiNonStream(response: Response): Promise<Response> {
  try {
    const anthropicBody = await response.json() as AntResponseBody;
    const openAIBody = toOpenAI(anthropicBody);

    return new Response(JSON.stringify(openAIBody), {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "content-type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to transform Anthropic response:", error);
    return response;
  }
}