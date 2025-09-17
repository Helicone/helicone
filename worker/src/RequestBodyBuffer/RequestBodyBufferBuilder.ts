import { DataDogClient } from "../lib/monitoring/DataDogClient";
import { IRequestBodyBuffer } from "./IRequestBodyBuffer";
import { RequestBodyBuffer_InMemory } from "./RequestBodyBuffer_InMemory";
import { RequestBodyBuffer_Remote } from "./RequestBodyBuffer_Remote";

// Read up to `limitBytes` from `readable`. If total bytes exceed the limit,
// stop and return `{ over: true }`. Otherwise, return the collected chunks so
// the caller can reuse them without re-reading the original source.
async function isOver(
  readable: ReadableStream<Uint8Array>,
  limitBytes: number
): Promise<boolean> {
  const reader = readable.getReader();
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > limitBytes) {
          try {
            await reader.cancel();
          } catch {}
          return true;
        }
      }
    }
    return false;
  } finally {
    // Reader is either closed or canceled above.
  }
}

/**
 * Sometimes the durable object is not initialized yet, so let's fallback to in-memory
 * @returns
 */
function tryInitRemote(
  request: Request,
  dataDogClient: DataDogClient | undefined,
  env: Env
) {
  try {
    if (env.REQUEST_BODY_BUFFER) {
      return new RequestBodyBuffer_Remote(
        null,
        dataDogClient,
        env.REQUEST_BODY_BUFFER,
        env
      );
    } else {
      return new RequestBodyBuffer_InMemory(
        request.body ?? null,
        dataDogClient,
        env
      );
    }
  } catch (e) {
    return new RequestBodyBuffer_InMemory(
      request.body ?? null,
      dataDogClient,
      env
    );
  }
}

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

  // If there is no body, in-memory is fine.
  if (!hasBody) {
    return new RequestBodyBuffer_InMemory(null, dataDogClient, env);
  }

  // Threshold for routing: small → Remote, large → InMemory.
  const MAX_INMEMORY_BYTES = 20 * 1024 * 1024; // 20 MiB

  // If Content-Length is present, honor it to avoid reading.
  const lenHeader = request.headers.get("content-length");
  const contentLength = lenHeader ? Number(lenHeader) : NaN;
  const sizeIsKnown = Number.isFinite(contentLength) && contentLength >= 0;

  if (sizeIsKnown) {
    if (contentLength > MAX_INMEMORY_BYTES) {
      // Large known body → InMemory, pass original stream
      return new RequestBodyBuffer_InMemory(
        request.body ?? null,
        dataDogClient,
        env
      );
    } else {
      return tryInitRemote(request, dataDogClient, env);
    }
  }

  // If container is not bound and size is unknown, default to in-memory.
  if (!env.REQUEST_BODY_BUFFER) {
    return new RequestBodyBuffer_InMemory(
      request.body ?? null,
      dataDogClient,
      env
    );
  }

  const originalBody = request.body!;
  const [leftForRemote, rightForProbe] = originalBody.tee();
  const exceeded = await isOver(rightForProbe, MAX_INMEMORY_BYTES);

  if (exceeded) {
    // Large request (> 20 MiB): use InMemory, feed it the left side of tee
    return new RequestBodyBuffer_InMemory(leftForRemote, dataDogClient, env);
  } else {
    return tryInitRemote(request, dataDogClient, env);
  }
}
