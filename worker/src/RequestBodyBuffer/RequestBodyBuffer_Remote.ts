import { DataDogClient } from "../lib/monitoring/DataDogClient";
import { IRequestBodyBuffer } from "./IRequestBodyBuffer";
import { getContainer } from "@cloudflare/containers";
import type { RequestBodyBufferContainer } from "./RequestBodyContainer";
import { err, ok, Result } from "../lib/util/results";

const BASE_URL = "https://thisdoesntmatter.helicone.ai";

/**
 * Containers are OOMing so let's load 5 containers to be safe.
 */
const CONTAINER_LOAD_COUNT = 10;

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
  private awsCreds: {
    accessKey: string;
    secretKey: string;
    region: string;
  };
  private metadataPromise: Promise<void>;

  private metadata: {
    isStream?: boolean;
    userId?: string;
    model?: string;
    size?: number;
  } = {};

  constructor(
    body: ReadableStream | null,
    private dataDogClient: DataDogClient | undefined,
    requestBodyBufferEnv: Env["REQUEST_BODY_BUFFER"],
    env: {
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      AWS_REGION: string;
    }
  ) {
    dataDogClient?.trackBufferType(true);
    this.awsCreds = {
      accessKey: env.AWS_ACCESS_KEY_ID,
      secretKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
    };
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
        body: body ?? null,
      })
      .then(async (response) => {
        if (!response.ok) {
          console.error(
            "RequestBodyBuffer_Remote ingest failed",
            response.status
          );
          return;
        }

        // READING THE BODY DOES NOT WORK IN PROD IDK WHY - Justin 2025-09-17
        // calling repsonse.text or response.json just hangs forever.. but works locally. UGHHH
        // const { size, isStream, userId, model } = await response.json<{
        //   size: number;
        //   isStream?: boolean;
        //   userId?: string;
        //   model?: string;
        // }>();
        // this.metadata = { isStream, userId, model };
      })
      .catch((e) => {
        console.error("RequestBodyBuffer_Remote ingest error", e);
      });

    this.metadataPromise = this.ingestPromise.then(() =>
      this.requestBodyBuffer
        .fetch(`${BASE_URL}/${this.uniqueId}/metadata`, {
          method: "GET",
        })
        .then((response) => {
          return response
            .json<{
              isStream?: boolean;
              userId?: string;
              model?: string;
              size?: number;
            }>()
            .then((json) => {
              this.metadata = json;
            });
        })
    );
  }

  public resetS3Client(env: Env): void {
    this.awsCreds = {
      accessKey: env.AWS_ACCESS_KEY_ID,
      secretKey: env.AWS_SECRET_ACCESS_KEY,
      region: env.AWS_REGION,
    };
  }

  async bodyLength(): Promise<number> {
    return this.metadata.size ?? 0;
  }

  public async tempSetBody(body: string): Promise<void> {
    // TODO we need to implement this for gateway
    // no-op for remote buffer
    await this.requestBodyBuffer.fetch(
      `${BASE_URL}/${this.uniqueId}/s3/set-body`,
      {
        method: "POST",
        body: JSON.stringify({ body: body }),
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  // super unsafe and should only be used for cases we know will be smaller bodies
  async unsafeGetRawText(): Promise<string> {
    console.log(
      "unsafeGetRawText on remote - Please traverse this stack trace and fix the issue"
    );
    // Track that we're doing an unsafe read from remote buffer
    this.dataDogClient?.trackUnsafeRemoteRead();
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

  async isStream(): Promise<boolean> {
    await this.metadataPromise.catch(() => undefined);
    return this.metadata.isStream ?? false;
  }

  async userId(): Promise<string | undefined> {
    await this.metadataPromise.catch(() => undefined);
    return this.metadata.userId;
  }

  async model(): Promise<string | undefined> {
    await this.metadataPromise.catch(() => undefined);
    return this.metadata.model;
  }

  /**
   * Prepares a stream in the container so that we return it as a stream in this format:
   * {
   *    request: requestBody,
   *    response: responseBody
   * }
   * @param responseBody
   */
  async uploadS3Body(
    responseBody: any,
    url: string,
    tags?: Record<string, string>
  ): Promise<Result<string, string>> {
    await this.ingestPromise.catch(() => undefined);
    const res = await this.requestBodyBuffer.fetch(
      `${BASE_URL}/${this.uniqueId}/s3/upload-body`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-access-key": this.awsCreds.accessKey,
          "x-secret-key": this.awsCreds.secretKey,
          "x-region": this.awsCreds.region,
        },
        body: JSON.stringify({ response: responseBody, tags, url }),
      }
    );

    if (!res.ok) {
      return err(`Failed to store data: ${res.statusText}, ${res.url}, ${url}`);
    }
    return ok(res.url);
  }

  async delete(): Promise<void> {
    await this.requestBodyBuffer.fetch(`${BASE_URL}/${this.uniqueId}`, {
      method: "DELETE",
    });
  }
}
