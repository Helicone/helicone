import { DataDogClient } from "../lib/monitoring/DataDogClient";
import { IRequestBodyBuffer } from "./IRequestBodyBuffer";
import { RequestBodyBuffer_InMemory } from "./RequestBodyBuffer_InMemory";
import { RequestBodyBuffer_Remote } from "./RequestBodyBuffer_Remote";

/**
 * Choose the request body buffer strategy without consuming the body.
 * Heuristic:
 * - If method is GET/HEAD or no body: use in-memory.
 * - If Content-Length is present and ≤ INMEMORY_MAX_BYTES: in-memory.
 * - Otherwise (unknown or large) and container binding exists: remote.
 * - If container binding is missing: fall back to in-memory.
 */
export async function RequestBodyBufferBuilder(
  request: Request,
  dataDogClient: DataDogClient | undefined,
  env: Env
): Promise<IRequestBodyBuffer> {
  const method = (request.method || "GET").toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method) && request.body !== null;

  // Conservative default for Worker memory usage.
  const INMEMORY_MAX_BYTES = 20 * 1024 * 1024; // 20 MiB

  // If there is no body, in-memory is fine.
  if (!hasBody) {
    return new RequestBodyBuffer_InMemory(request, dataDogClient, env);
  }

  // If the size is known and small enough, stay in-memory.
  const lenHeader = request.headers.get("content-length");
  const contentLength = lenHeader ? Number(lenHeader) : NaN;
  const sizeIsKnown = Number.isFinite(contentLength) && contentLength >= 0;

  if (sizeIsKnown && contentLength <= INMEMORY_MAX_BYTES) {
    return new RequestBodyBuffer_InMemory(request, dataDogClient, env);
  }

  // If size is large or unknown and we have the container, use remote.
  if (
    env.REQUEST_BODY_BUFFER &&
    // TEMP ONLY SEND KNOWN SIZES TO REMOTE - we will read the first 20 megabytes later and check to swap it over if needed
    sizeIsKnown &&
    contentLength > INMEMORY_MAX_BYTES
  ) {
    return new RequestBodyBuffer_Remote(
      request,
      dataDogClient,
      env.REQUEST_BODY_BUFFER,
      env
    );
  }

  // Fallback: if binding not available, use in-memory.
  return new RequestBodyBuffer_InMemory(request, dataDogClient, env);
}
