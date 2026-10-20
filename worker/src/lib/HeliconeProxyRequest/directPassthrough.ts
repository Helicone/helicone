import { RequestWrapper } from "../RequestWrapper";
import {
  isTargetAllowedForPin,
  pinnedTargetRejection,
} from "../security/credentialPin";
import { buildProviderRequestHeaders } from "../security/outboundHeaders";

/**
 * Unlogged passthrough to a fixed first-party provider origin (OpenAI /
 * Anthropic file uploads, OpenAI audio). Same outbound rules as the logged
 * path: allowlisted headers only, vault keys pinned to their provider, and
 * redirects are not followed.
 */
export async function directProviderPassthrough({
  origin,
  requestWrapper,
  method,
  body,
  includeSearch = true,
}: {
  origin: "https://api.openai.com" | "https://api.anthropic.com";
  requestWrapper: RequestWrapper;
  method: string;
  body: BodyInit | null;
  includeSearch?: boolean;
}): Promise<Response> {
  const target = new URL(
    `${origin}${requestWrapper.url.pathname}${
      includeSearch ? requestWrapper.url.search : ""
    }`
  );

  const pin = requestWrapper.getCredentialPin();
  if (pin && !isTargetAllowedForPin(pin, target)) {
    return pinnedTargetRejection(pin, target);
  }

  return await fetch(target.href, {
    method,
    headers: buildProviderRequestHeaders(requestWrapper.getHeaders()),
    body,
    redirect: "manual",
    // @ts-ignore - duplex is needed for streaming bodies
    duplex: "half",
  });
}
