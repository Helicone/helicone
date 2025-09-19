import { SignatureV4 } from "@smithy/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { HttpRequest } from "@smithy/protocol-http";
import type { SignAwsInput, SignAwsOutput } from "../types";

function modelFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    const parts = url.pathname.split("/");
    return decodeURIComponent(parts.at(-2) ?? "");
  } catch {
    return "";
  }
}

export async function signAws(body: SignAwsInput, payload: string): Promise<SignAwsOutput> {
  const { region, forwardToHost, requestHeaders, method, urlString } = body;

  const awsAccessKey = requestHeaders?.["aws-access-key"] ?? "";
  const awsSecretKey = requestHeaders?.["aws-secret-key"] ?? "";
  const awsSessionToken = requestHeaders?.["aws-session-token"];
  const service = "bedrock";

  const signer = new SignatureV4({
    service,
    region,
    credentials: {
      accessKeyId: awsAccessKey,
      secretAccessKey: awsSecretKey,
      ...(awsSessionToken ? { sessionToken: awsSessionToken } : {}),
    },
    sha256: Sha256,
  });

  const url = new URL(urlString);
  const headers: Record<string, string> = {
    host: forwardToHost,
    "content-type": "application/json",
  };

  // Pass through only AWS-relevant headers (lower-cased keys expected)
  const passthrough = [
    "x-amz-date",
    "x-amz-security-token",
    "x-amz-content-sha256",
    "x-amz-target",
  ];
  for (const [k, v] of Object.entries(requestHeaders ?? {})) {
    if (passthrough.includes(k.toLowerCase())) headers[k] = v;
  }

  const req = new HttpRequest({
    method,
    protocol: url.protocol,
    hostname: forwardToHost,
    path: url.pathname + url.search,
    headers,
    body: payload,
  });

  const signed = await signer.sign(req);

  const outHeaders: Record<string, string> = {
    host: forwardToHost,
    "content-type": "application/json",
  };
  for (const [k, v] of Object.entries(signed.headers)) {
    if (v !== undefined && v !== null) outHeaders[k] = String(v);
  }

  return {
    newHeaders: outHeaders,
    model: modelFromUrl(urlString),
  };
}

