import { timingSafeEqual } from "crypto";
import { RequestWrapper } from "../../lib/RequestWrapper";
import { InternalResponse } from "../../api/lib/internalResponse";

export function validateAdminAuth(
  requestWrapper: RequestWrapper,
  env: Env
): Response | null {
  const authHeader = requestWrapper.headers.get("Authorization");
  if (!authHeader) {
    return InternalResponse.unauthorized();
  }

  const providedToken = authHeader.replace("Bearer ", "");
  const expectedToken = env.HELICONE_MANUAL_ACCESS_KEY;

  if (!expectedToken) {
    console.error("HELICONE_MANUAL_ACCESS_KEY not configured");
    return InternalResponse.newError("Server configuration error", 500);
  }

  const providedBuffer = Buffer.from(providedToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (providedBuffer.length !== expectedBuffer.length) {
    return InternalResponse.unauthorized();
  }

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return InternalResponse.unauthorized();
  }

  return null;
}
