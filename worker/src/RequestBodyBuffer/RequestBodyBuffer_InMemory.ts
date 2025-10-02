import { SignatureV4 } from "@smithy/signature-v4";
import { DataDogClient } from "../lib/monitoring/DataDogClient";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import { IRequestBodyBuffer, ValidRequestBody } from "./IRequestBodyBuffer";
import { ok, Result } from "../lib/util/results";
import { S3Client } from "../lib/clients/S3Client";

async function concatUint8Arrays(
  uint8arrays: Uint8Array[]
): Promise<Uint8Array> {
  const blob = new Blob(uint8arrays);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

// NEVER give the user direct access to the body
export class RequestBodyBuffer_InMemory implements IRequestBodyBuffer {
  private cachedText: string | null = null;
  private s3Client: S3Client;

  constructor(
    private request: Request | null,
    private dataDogClient: DataDogClient | undefined,
    env: Env
  ) {
    dataDogClient?.trackBufferType(false);
    this.s3Client = new S3Client(
      env.S3_ACCESS_KEY ?? "",
      env.S3_SECRET_KEY ?? "",
      env.S3_ENDPOINT ?? "",
      env.S3_BUCKET_NAME ?? "",
      env.S3_REGION ?? "us-west-2"
    );
  }

  public resetS3Client(env: Env): void {
    this.s3Client = new S3Client(
      env.S3_ACCESS_KEY ?? "",
      env.S3_SECRET_KEY ?? "",
      env.S3_ENDPOINT ?? "",
      env.S3_BUCKET_NAME ?? "",
      env.S3_REGION ?? "us-west-2"
    );
  }

  public async tempSetBody(body: string): Promise<void> {
    this.cachedText = body;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyOverride(body: any, override: object): object {
    for (const [key, value] of Object.entries(override)) {
      if (key in body && typeof value !== "object") {
        body[key] = value;
      } else {
        body[key] = this.applyOverride(body[key], value);
      }
    }
    return body;
  }

  public async setBodyOverride(override: object): Promise<void> {
    try {
      const text = await this.unsafeGetRawText();
      const bodyJson = JSON.parse(text);
      const modifiedBody = this.applyOverride(bodyJson, override);
      this.cachedText = JSON.stringify(modifiedBody);
    } catch (e) {
      console.error("Failed to apply body override:", e);
      throw e;
    }
  }

  // super unsafe and should only be used for cases we know will be smaller bodies
  async unsafeGetRawText(): Promise<string> {
    if (this.cachedText) {
      return this.cachedText;
    }

    this.cachedText = (await this.request?.text()) ?? "";

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

  async getReadableStreamToBody(): Promise<string> {
    // Override is already applied in setBodyOverride, just return cached text
    return await this.unsafeGetRawText();
  }

  private async getJson<T>(): Promise<T> {
    try {
      return JSON.parse(await this.unsafeGetRawText());
    } catch (e) {
      console.error("RequestWrapper.getJson", e, await this.unsafeGetRawText());
      return {} as T;
    }
  }

  async isStream(): Promise<boolean> {
    const json = await this.getJson<{ stream?: boolean }>();
    return json.stream === true;
  }

  async userId(): Promise<string | undefined> {
    const json = await this.getJson<{ user?: string }>();
    return json.user;
  }

  async model(): Promise<string | undefined> {
    const json = await this.getJson<{ model?: string }>();
    return json.model ?? "unknown";
  }

  async uploadS3Body(
    responseBody: any,
    url: string,
    tags?: Record<string, string>
  ): Promise<Result<string, string>> {
    return this.s3Client.store(
      url,
      JSON.stringify({
        request: await this.unsafeGetRawText(),
        response: responseBody,
      }),
      tags
    );
  }

  async bodyLength(): Promise<number> {
    return (await this.unsafeGetRawText())?.length ?? 0;
  }

  async delete(): Promise<void> {
    // no-op
  }
}
