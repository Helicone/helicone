import { SignatureV4 } from "@smithy/signature-v4";
import { DataDogClient } from "../lib/monitoring/DataDogClient";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import { IRequestBodyBuffer } from "./IRequestBodyBuffer";
// NEVER give the user direct access to the body
export class RequestBodyBuffer_InMemory implements IRequestBodyBuffer {
  private cachedText: string | null = null;

  constructor(
    private request: Request,
    private dataDogClient: DataDogClient | undefined
  ) {}

  public tempSetBody(body: string): void {
    this.cachedText = body;
  }

  // super unsafe and should only be used for cases we know will be smaller bodies
  async unsafeGetRawText(): Promise<string> {
    if (this.cachedText) {
      return this.cachedText;
    }
    this.cachedText = await this.request.text();
    try {
      if (this.dataDogClient) {
        const sizeBytes = DataDogClient.estimateStringSize(this.cachedText);
        this.dataDogClient.trackMemory("request-body", sizeBytes);
      }
    } catch (e) {
      // Silently catch - never let monitoring break the request
    }
    return this.cachedText;
  }

  async signAWSRequest({
    region,
    forwardToHost,
    requestHeaders,
    method,
    urlString,
  }: {
    region: string;
    forwardToHost: string;
    requestHeaders: Record<string, string>;
    method: string;
    urlString: string;
  }): Promise<{
    newHeaders: Headers;
    model: string;
  }> {
    const url = new URL(urlString);
    // Extract model from URL path
    const pathParts = url.pathname.split("/");
    const model = decodeURIComponent(pathParts.at(-2) ?? "");

    const awsAccessKey = requestHeaders?.["aws-access-key"];
    const awsSecretKey = requestHeaders?.["aws-secret-key"];
    const awsSessionToken = requestHeaders?.["aws-session-token"];
    const service = "bedrock";

    const sigv4 = new SignatureV4({
      service,
      region,
      credentials: {
        accessKeyId: awsAccessKey ?? "",
        secretAccessKey: awsSecretKey ?? "",
        ...(awsSessionToken ? { sessionToken: awsSessionToken } : {}),
      },
      sha256: Sha256,
    });

    const headers = new Headers();

    // Required headers for AWS requests
    headers.set("host", forwardToHost);
    headers.set("content-type", "application/json");

    // Include only AWS-specific headers needed for authentication
    const awsHeaders = [
      "x-amz-date",
      "x-amz-security-token",
      "x-amz-content-sha256",
      "x-amz-target",
      // Add any other required x-amz headers for your specific use case
    ];

    for (const [key, value] of Object.entries(requestHeaders)) {
      if (awsHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }

    const request = new HttpRequest({
      method: method,
      protocol: url.protocol,
      hostname: forwardToHost,
      path: url.pathname + url.search,
      headers: Object.fromEntries(headers.entries()),
      body: await this.unsafeGetRawText(),
    });

    const signedRequest = await sigv4.sign(request);

    // Create new headers with the signed values
    const newHeaders = new Headers();
    // Only copy over the essential headers
    newHeaders.set("host", forwardToHost);
    newHeaders.set("content-type", "application/json");

    // Add all the signed AWS headers
    for (const [key, value] of Object.entries(signedRequest.headers)) {
      if (value) {
        newHeaders.set(key, value.toString());
      }
    }

    return {
      newHeaders,
      model,
    };
  }

  getReadableStreamToBody(): ReadableStream {
    const getUnsafeBody = async () => {
      const body = await this.unsafeGetRawText();
      return body;
    };
    return new ReadableStream({
      async pull(controller) {
        controller.enqueue(await getUnsafeBody());
        controller.close();
      },
    });
  }
}
