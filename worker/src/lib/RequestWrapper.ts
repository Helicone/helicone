// This request wrapper allows us to mock the request object in tests.
// It also allows us to add additional functionality to the request object
// without modifying the request object itself.
// This also allows us to not have to redefine other objects repetitively like URL.

import { createClient } from "@supabase/supabase-js";
import { Env, hash } from "..";
import { Result } from "../results";
import { HeliconeHeaders } from "./HeliconeHeaders";
import HashiCorpVault from "./vault/HashiCorpVault";

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

  private cachedText: string | null = null;

  constructor(private request: Request, private env: Env) {
    this.url = new URL(request.url);
    this.heliconeHeaders = new HeliconeHeaders(request.headers);
    this.authorization = this.getAuthorization(request.headers);
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
    return this.request.headers;
  }

  setHeader(key: string, value: string): void {
    this.request.headers.set(key, value);
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

  async getUserId(): Promise<string | undefined> {
    const userId =
      this.heliconeHeaders.userId ||
      (await this.getJson<{ user?: string }>()).user;
    return userId;
  }

  private getAuthorization(headers: Headers): string | undefined {
    const authKey =
      headers.get("Authorization") ?? // Openai
      headers.get("x-api-key") ?? // Anthropic
      headers.get("api-key") ?? // Azure
      undefined;

    if (this.env.VAULT_ENABLED && authKey?.startsWith("Bearer sk-helicone-proxy")) {
      const vault = new HashiCorpVault();
      // const supabaseClient = createClient(this.env.SUPABASE_URL, this.env.SUPABASE_SERVICE_ROLE_KEY);
      // supabaseClient.from("helicone_proxy_keys")
      // .select("*")
      // .eq()
    }

    return authKey;
  }
}
