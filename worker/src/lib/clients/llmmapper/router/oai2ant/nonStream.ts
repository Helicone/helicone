import { toOpenAI } from "../../providers/anthropic/response/toOpenai";
import { AntResponseBody } from "../../types";
import { toAnthropic } from "../../providers/openai/request/toAnthropic";
import { OpenAIRequestBody } from "../../types";

export async function oai2ant({
  body,
  headers,
}: {
  body: OpenAIRequestBody;
  headers: Headers;
}): Promise<Response> {
  const anthropicBody = toAnthropic(body);

  let auth = headers.get("Authorization");

  if (auth?.startsWith("Bearer ")) {
    auth = auth.split(" ")[1];
  }

  let anthropicVersion = headers.get("anthropic-version");
  if (!anthropicVersion) {
    anthropicVersion = "2023-06-01";
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    body: JSON.stringify(anthropicBody),
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "x-api-key": auth ?? "",
      "anthropic-version": anthropicVersion,
    },
  });

  try {
    return await oai2antResponse(response);
  } catch (e) {
    const responseBody = await response.json<AntResponseBody>();
    return new Response(JSON.stringify(responseBody), {
      headers: {
        ...response.headers,
        "Content-Type": "application/json",
      },
    });
  }
}

export async function oai2antResponse(response: Response): Promise<Response> {
  try {
    const anthropicBody = await response.json<AntResponseBody>();
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