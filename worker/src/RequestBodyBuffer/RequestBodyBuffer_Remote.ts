import { DataDogClient } from "../lib/monitoring/DataDogClient";
import { IRequestBodyBuffer } from "./IRequestBodyBuffer";
import { getContainer } from "@cloudflare/containers";
import type { RequestBodyBufferContainer } from "./RequestBodyContainer";

const BASE_URL = "https://thisdoesntmatter.helicone.ai";

const CONTAINER_LOAD_COUNT = 2;

function fnvHash(str: string): number {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // FNV prime, convert to unsigned 32-bit
  }
  return hash;
}

function getContainerIdSharedHash(requestId: string) {
  //requestId to number between 0 and CONTAINER_LOAD_COUNT
  const number = fnvHash(requestId) % CONTAINER_LOAD_COUNT;
  return number;
}

/**
 * We are aiming for 28 RPM and each container should clear after 5 seconds
 * That is ~3 active requests at a time
 *
 * With a average body of ~120 mb we only need 3 * 120 mb = 360 mb
 *
 * For a basic container (1gig) we only need 1 container for now, but will use 2 for now to be safe.
 *
 * but monitor closely and scale up if needed.
 */
function getRequestBodyContainer(
  requestBodyBufferEnv: Env["REQUEST_BODY_BUFFER"],
  requestId: string
) {
  return getContainer(
    requestBodyBufferEnv,
    getContainerIdSharedHash(requestId).toString()
  );
}

export class RequestBodyBuffer_Remote implements IRequestBodyBuffer {
  private requestBodyBuffer: DurableObjectStub<RequestBodyBufferContainer>;

  // **
  // * NOTE we are explicitly not using the requestId here
  // * because users can set their own requestId.
  // So we need to generate a unique id for each request. (For security reasons)
  // */
  private uniqueId: string;
  private ingestPromise: Promise<void>;

  constructor(
    request: Request,
    private dataDogClient: DataDogClient | undefined,
    requestBodyBufferEnv: Env["REQUEST_BODY_BUFFER"]
  ) {
    this.uniqueId = crypto.randomUUID();
    this.requestBodyBuffer = getRequestBodyContainer(
      requestBodyBufferEnv,
      this.uniqueId
    );
    const headers = new Headers();
    headers.set("content-type", "application/octet-stream");

    this.ingestPromise = this.requestBodyBuffer
      .fetch(`${BASE_URL}/${this.uniqueId}`, {
        method: "POST",
        headers,
        body: request.body,
      })
      .then(async (response) => {
        if (!response.ok) {
          console.error(
            "RequestBodyBuffer_Remote ingest failed",
            response.status
          );
          return;
        }
        const { size } = await response.json<{ size: number }>();
        console.log("RequestBodyBuffer_Remote ingest success", size);
        dataDogClient?.trackMemory("container-request-body-size", size);
      })
      .catch((e) => {
        console.error("RequestBodyBuffer_Remote ingest error", e);
      });
  }

  public tempSetBody(body: string): void {
    // no-op for remote buffer
  }
  // super unsafe and should only be used for cases we know will be smaller bodies
  async unsafeGetRawText(): Promise<string> {
    console.log(
      "unsafeGetRawText on remote - Please traverse this stack trace and fix the issue"
    );
    this.dataDogClient?.trackMemory("container-called-unsafe-read", 1);
    await this.ingestPromise.catch(() => undefined);

    const response = await this.requestBodyBuffer.fetch(
      `${BASE_URL}/${this.uniqueId}/unsafe/read`,
      {
        method: "GET",
      }
    );
    if (!response.ok) {
      // keep behavior graceful; return empty string on miss
      return "";
    }
    return await response.text();
  }

  async signAWSRequest(body: {
    region: string;
    forwardToHost: string;
    requestHeaders: Record<string, string>;
    method: string;
    urlString: string;
  }): Promise<{
    newHeaders: Headers;
    model: string;
  }> {
    const response = await this.requestBodyBuffer.fetch(
      `${BASE_URL}/${this.uniqueId}/sign-aws`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      throw new Error(`sign-aws failed with status ${response.status}`);
    }
    const json = await response.json<{
      newHeaders: Record<string, string>;
      model: string;
    }>();
    const headers = new Headers();
    for (const [k, v] of Object.entries(json.newHeaders ?? {})) {
      if (v !== undefined && v !== null) headers.set(k, String(v));
    }
    return { newHeaders: headers, model: json.model };
  }

  async getReadableStreamToBody(): Promise<ReadableStream | null> {
    // Wait for ingest to be attempted to reduce race with GET
    await this.ingestPromise.catch(() => undefined);
    const response = await this.requestBodyBuffer.fetch(
      `${BASE_URL}/${this.uniqueId}/unsafe/read`,
      { method: "GET" }
    );
    if (!response.ok) return null;
    return response.body ?? null;
  }
}
