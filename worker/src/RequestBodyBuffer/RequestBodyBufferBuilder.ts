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
  bodyStream: ReadableStream | null,
  dataDogClient: DataDogClient | undefined,
  env: Env
) {
  try {
    if (env.REQUEST_BODY_BUFFER) {
      return new RequestBodyBuffer_Remote(
        bodyStream ?? null,
        dataDogClient,
        env.REQUEST_BODY_BUFFER,
        env
      );
    } else {
      return new RequestBodyBuffer_InMemory(
        bodyStream ?? null,
        dataDogClient,
        env
      );
    }
  } catch (e) {
    return new RequestBodyBuffer_InMemory(
      bodyStream ?? null,
      dataDogClient,
      env
    );
  }
}

function toNumber(value: string | null): number {
  try {
    return value ? Number(value) : NaN;
  } catch (e) {
    return NaN;
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

  if (["GET", "HEAD"].includes(method) || request.body === null) {
    dataDogClient?.trackBufferDecision("get_head");
    return new RequestBodyBuffer_InMemory(
      request.body ?? null,
      dataDogClient,
      env
    );
  }

  // Threshold for routing: small → InMemory, large → Remote.
  // ** 20 is the perfect size from my test - Justin 2025-09-18
  const MAX_INMEMORY_BYTES = 20 * 1024 * 1024; // 20 MiB

  // If Content-Length is present, honor it to avoid reading.
  const lenHeader = request.headers.get("content-length");
  const contentLength = toNumber(lenHeader);
  const sizeIsKnown = Number.isFinite(contentLength) && contentLength >= 0;

  if (sizeIsKnown) {
    const sizeMB = contentLength / (1024 * 1024);
    if (contentLength > MAX_INMEMORY_BYTES) {
      dataDogClient?.trackBufferDecision("known_large", sizeMB);
      return tryInitRemote(request.body, dataDogClient, env);
    } else {
      dataDogClient?.trackBufferDecision("known_small", sizeMB);
      return new RequestBodyBuffer_InMemory(
        request.body ?? null,
        dataDogClient,
        env
      );
    }
  }
  dataDogClient?.trackBufferDecision("size_unknown");

  // If container is not bound and size is unknown, default to in-memory.
  if (!env.REQUEST_BODY_BUFFER) {
    dataDogClient?.trackBufferDecision("unknown_no_container");
    return new RequestBodyBuffer_InMemory(
      request.body ?? null,
      dataDogClient,
      env
    );
  }

  // Size unknown, container available - must use tee() to check size
  const originalBody = request.body!;
  const [mainBodyToConsume, streamToCheckSize] = originalBody.tee();
  const exceeded = await isOver(streamToCheckSize, MAX_INMEMORY_BYTES);

  if (exceeded) {
    dataDogClient?.trackBufferDecision("tee_large");
    return tryInitRemote(mainBodyToConsume, dataDogClient, env);
  } else {
    dataDogClient?.trackBufferDecision("tee_small");
    return new RequestBodyBuffer_InMemory(
      mainBodyToConsume,
      dataDogClient,
      env
    );
  }
}
