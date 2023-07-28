// This request wrapper allows us to mock the request object in tests.
// It also allows us to add additional functionality to the request object
// without modifying the request object itself.
// This also allows us to not have to redefine other objects repetitively like URL.

import { Env, hash } from "..";
import { Result } from "../results";
import { HeliconeHeaders } from "./HeliconeHeaders";

export type RequestHandlerType =
  | "proxy_only"
  | "proxy_log"
  | "logging"
  | "feedback";

export class RequestWrapper {
  url: URL;
  heliconeHeaders: HeliconeHeaders;
  authorization: string | undefined;
  providerAuth: string | undefined;
  headers: Headers;

  private cachedText: string | null = null;

  /*
  We allow the Authorization header to take both the provider key and the helicone auth key comma seprated.
  like this (Bearer sk-123, Beaer helicone-sk-123)
  */
  private mutatedAuthorizationHeaders(request: Request): Headers {
    console.log("MUTATING AUTHORIZATION... REQUEST", request);
    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return request.headers;
    }
    if (
      !authorization.includes(",") ||
      !authorization.includes("helicone-sk-")
    ) {
      return request.headers;
    }
    console.log("MUTATING AUTHORIZATION HEADER", authorization);

    const headers = new Headers(request.headers);
    const authorizationKeys = authorization.split(",").map((x) => x.trim());

    const heliconeAuth = authorizationKeys.find((x) =>
      x.includes("helicone-sk-")
    );
    const providerAuth = authorizationKeys.find(
      (x) => !x.includes("helicone-sk-")
    );

    if (providerAuth) {
      headers.set("Authorization", providerAuth);
    }
    if (heliconeAuth) {
      headers.set(
        "helicone-auth",
        heliconeAuth.replace("helicone-", "").trim()
      );
    }
    return headers;
  }

  constructor(private request: Request) {
    this.headers = this.mutatedAuthorizationHeaders(request);
    this.url = new URL(request.url);
    this.heliconeHeaders = new HeliconeHeaders(this.headers);
    this.authorization = this.getAuthorization(this.headers);
  }

  async getText(): Promise<string> {
    if (this.cachedText) {
      return this.cachedText;
    }

    this.cachedText = await this.request.text();
    return this.cachedText;
  }

  async getJson<T>(): Promise<T> {
    try {
      return JSON.parse(await this.getText());
    } catch (e) {
      console.error("RequestWrapper.getJson", e, await this.getText());
      return {} as T;
    }
  }

  getBody(): ReadableStream<Uint8Array> | null {
    return this.request.body;
  }

  getHeaders(): Headers {
    return this.headers;
  }

  setHeader(key: string, value: string): void {
    this.headers.set(key, value);
  }

  getMethod(): string {
    return this.request.method;
  }

  getUrl(): string {
    return this.request.url;
  }

  async getHeliconeAuthHeader(): Promise<Result<string | null, string>> {
    const heliconeAuth = this.heliconeHeaders.heliconeAuth;
    if (!heliconeAuth) {
      return { data: null, error: null };
    }
    if (!heliconeAuth.includes("Bearer ")) {
      return { data: null, error: "Must included Bearer in API Key" };
    }

    const apiKey = heliconeAuth.replace("Bearer ", "").trim();
    const apiKeyPattern =
      /^sk-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/;

    if (!apiKeyPattern.test(apiKey)) {
      return {
        data: null,
        error: "API Key is not well formed",
      };
    }
    const apiKeyHash = await hash(`Bearer ${apiKey}`);
    return { data: apiKeyHash, error: null };
  }

  async getProviderAuthHeader(): Promise<string | undefined> {
    return this.authorization ? await hash(this.authorization) : undefined;
  }

  async getAuthorizationHash(): Promise<string | undefined> {
    return this.authorization ? await hash(this.authorization) : undefined;
  }

  async getUserId(): Promise<string | undefined> {
    const userId =
      this.heliconeHeaders.userId ||
      (await this.getJson<{ user?: string }>()).user;
    return userId;
  }

  private getAuthorization(headers: Headers): string | undefined {
    return (
      headers.get("Authorization") ?? // Openai
      headers.get("x-api-key") ?? // Anthropic
      headers.get("api-key") ?? // Azure
      undefined
    );
  }
}
