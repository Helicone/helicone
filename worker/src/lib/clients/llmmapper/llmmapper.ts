import { OpenAIRequestBody } from "./providers/openai/request/types";
import { oai2ant } from "./router/oai2ant/nonStream";
import { oaiStream2antStreamResponse } from "./router/oai2ant/stream";

function tryJSONParse(body: string): OpenAIRequestBody | null {
  try {
    return JSON.parse(body);
  } catch (e) {
    return null;
  }
}

export async function llmmapper(
  targetUrl: URL,
  init: {
    body: string;
    headers: Record<string, string>;
  }
): Promise<Response> {
  if (targetUrl.pathname.startsWith("/oai2ant")) {
    const body = tryJSONParse(init?.body ?? "{}");
    if (!body) {
      return new Response("Invalid body", { status: 400 });
    }
    if (body?.stream) {
      return oaiStream2antStreamResponse({
        body: body,
        headers: new Headers(init.headers),
      });
    } else {
      return oai2ant({ body: body, headers: new Headers(init.headers) });
    }
  }

  return new Response("Unsupported path", { status: 404 });
}
