import { DataDogClient } from "../lib/monitoring/DataDogClient";
import { IRequestBodyBuffer } from "./IRequestBodyBuffer";
import { getContainer } from "@cloudflare/containers";
import { RequestBodyBufferContainer } from "./RequestBodyContainer";

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

  constructor(
    request: Request,
    dataDogClient: DataDogClient | undefined,
    requestBodyBufferEnv: Env["REQUEST_BODY_BUFFER"],
    private requestId: string
  ) {
    this.requestBodyBuffer = getRequestBodyContainer(
      requestBodyBufferEnv,
      requestId
    );
    this.requestBodyBuffer
      .fetch(`${BASE_URL}/${requestId}`, {
        method: "POST",
        body: request.body,
      })
      .then(async (response) => {
        const { size } = await response.json<{ size: number }>();
        dataDogClient?.trackMemory("container-request-body-size", size);
      });
  }

  public tempSetBody(body: string): void {
    throw new Error("Not implemented");
  }
  // super unsafe and should only be used for cases we know will be smaller bodies
  async unsafeGetRawText(): Promise<string> {
    throw new Error("Not implemented");
    // const response = await this.requestBodyBuffer.fetch(
    //   `${BASE_URL}/${this.requestId}/unsafe/read`,
    //   {
    //     method: "GET",
    //   }
    // );
    // return await response.text();
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
    throw new Error("Not implemented");
    // const response = await this.requestBodyBuffer.fetch(
    //   `${BASE_URL}/${this.requestId}/sign-aws`,
    //   {
    //     method: "GET",
    //     body: JSON.stringify(body),
    //   }
    // );
    // return await response.json();
  }
}
