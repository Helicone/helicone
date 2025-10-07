import { HeliconeChatCreateParams } from "@helicone-package/prompts/types";
import { ant2oai } from "./router/oai2ant/nonStream";
import { antStream2oaiStream } from "./router/oai2ant/stream";

export function tryJSONParse(body: string): HeliconeChatCreateParams | null {
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
      return antStream2oaiStream({
        body: body,
        headers: new Headers(init.headers),
      });
    } else {
      return ant2oai({ body: body, headers: new Headers(init.headers) });
    }
  }

  return new Response("Unsupported path", { status: 404 });
}
