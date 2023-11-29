// This request wrapper allows us to mock the request object in tests.
// It also allows us to add additional functionality to the request object
// without modifying the request object itself.
// This also allows us to not have to redefine other objects repetitively like URL.

import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env, hash } from "..";
import { Result } from "../results";
import { HeliconeHeaders } from "./HeliconeHeaders";
import { Database } from "../../supabase/database.types";
import { checkLimits } from "./limits/check";
import { getFromCache, storeInCache } from "./secureCache";
import { HeliconeAuth } from "../db/DBWrapper";

export type RequestHandlerType =
  | "proxy_only"
  | "proxy_log"
  | "logging"
  | "feedback";

export class RequestWrapper {
  private authorization: string | undefined;
  url: URL;
  heliconeHeaders: HeliconeHeaders;
  providerAuth: string | undefined;
  headers: Headers;
  heliconeProxyKeyId: string | undefined;
  baseURLOverride: string | null;

  private cachedText: string | null = null;
  private bodyKeyOverride: object | null = null;

  /*
  We allow the Authorization header to take both the provider key and the helicone auth key comma seprated.
  like this (Bearer sk-123, Beaer helicone-sk-123)
  */
  private mutatedAuthorizationHeaders(request: Request): Headers {
    const HELICONE_KEY_ID = "sk-helicone-";

    const authorization = request.headers.get("Authorization");
    if (!authorization) {
      return request.headers;
    }
    if (
      !authorization.includes(",") ||
      !authorization.includes(HELICONE_KEY_ID)
    ) {
      return request.headers;
    }

    const headers = new Headers(request.headers);

    if (headers.has("helicone-auth")) {
      throw new Error(
        "Cannot have both helicone-auth and Helicone Authorization headers"
      );
    }

    const authorizationKeys = authorization.split(",").map((x) => x.trim());

    const heliconeAuth = authorizationKeys.find((x) =>
      x.includes(HELICONE_KEY_ID)
    );
    const providerAuth = authorizationKeys.find(
      (x) => !x.includes(HELICONE_KEY_ID)
    );

    if (providerAuth) {
      headers.set("Authorization", providerAuth);
    }
    if (heliconeAuth) {
      headers.set("helicone-auth", heliconeAuth);
    }
    return headers;
  }

  private constructor(private request: Request, private env: Env) {
    this.url = new URL(request.url);
    this.headers = this.mutatedAuthorizationHeaders(request);
    this.heliconeHeaders = new HeliconeHeaders(request.headers);
    this.baseURLOverride = null;
  }

  static async create(
    request: Request,
    env: Env
  ): Promise<Result<RequestWrapper, string>> {
    const requestWrapper = new RequestWrapper(request, env);
    const authorization = await requestWrapper.setAuthorization(env);

    if (authorization.error) {
      return { data: null, error: authorization.error };
    }

    return { data: requestWrapper, error: null };
  }

  getNodeId(): string | null {
    return this.heliconeHeaders.nodeId;
  }

  setBaseURLOverride(url: string): void {
    this.baseURLOverride = url;
  }

  async auth(): Promise<HeliconeAuth> {
    switch (this.heliconeHeaders.heliconeAuthV2?._type) {
      case "jwt":
        return {
          _type: "jwt",
          token: this.heliconeHeaders.heliconeAuthV2.token,
        };
      default:
        return this.heliconeProxyKeyId
          ? {
              _type: "bearer",
              _bearerType: "heliconeProxyKey",
              token: this.heliconeProxyKeyId,
            }
          : {
              _type: "bearer",
              _bearerType: "heliconeApiKey",
              token: (await this.getProviderAuthHeader()) ?? "",
            };
    }
  }

  setBodyKeyOverride(bodyKeyOverride: object): void {
    this.bodyKeyOverride = bodyKeyOverride;
  }

  private overrideBody(body: any, override: object): object {
    for (const [key, value] of Object.entries(override)) {
      if (key in body && typeof value !== "object") {
        body[key] = value;
      } else {
        body[key] = this.overrideBody(body[key], value);
      }
    }
    return body;
  }

  private async getRawText(): Promise<string> {
    if (this.cachedText) {
      return this.cachedText;
    }
    this.cachedText = await this.request.text();
    return this.cachedText;
  }

  async getText(): Promise<string> {
    let text = await this.getRawText();
    if (this.bodyKeyOverride) {
      try {
        const bodyJson = await JSON.parse(text);
        const bodyOverrideJson = await JSON.parse(
          JSON.stringify(this.bodyKeyOverride)
        );
        const body = this.overrideBody(bodyJson, bodyOverrideJson);
        text = JSON.stringify(body);
      } catch (e) {
        throw new Error("Could not stringify bodyKeyOverride");
      }
    }
    return text;
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

  remapHeaders(headers: Headers): void {
    this.headers = headers;
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
    const apiKeyPatternV2 =
      /^sk-helicone-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/;

    if (!(apiKeyPattern.test(apiKey) || apiKeyPatternV2.test(apiKey))) {
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

  getAuthorization(): string | undefined {
    return this.authorization || undefined;
  }

  private async setAuthorization(
    env: Env
  ): Promise<Result<string | undefined, string>> {
    if (this.authorization) {
      return { data: this.authorization, error: null };
    }

    const authKey =
      this.headers.get("Authorization") ?? // Openai
      this.headers.get("x-api-key") ?? // Anthropic
      this.headers.get("api-key") ?? // Azure
      undefined;

    // If using proxy key, get the real key from vault
    if (
      this.env.VAULT_ENABLED &&
      authKey?.startsWith("Bearer sk-helicone-proxy")
    ) {
      let providerKeyRow: {
        providerKey?: string;
        proxyKeyId?: string;
      } | null = await getFromCache(authKey, env).then((x) =>
        x ? JSON.parse(x) : null
      );
      if (!providerKeyRow) {
        const { data, error } = await this.getProviderKeyFromProxy(
          authKey,
          env
        );
        if (error || !data || !data.providerKey || !data.proxyKeyId) {
          return {
            data: null,
            error: `Proxy key not found. Error: ${error}`,
          };
        }
        providerKeyRow = data;
        await storeInCache(authKey, JSON.stringify(providerKeyRow), this.env);
      }

      this.heliconeProxyKeyId = providerKeyRow.proxyKeyId;
      this.authorization = providerKeyRow.providerKey;
      const headers = new Headers(this.headers);
      headers.set("Authorization", `Bearer ${this.authorization}`);
      this.headers = headers;
    } else {
      this.authorization = authKey;
      return { data: this.authorization, error: null };
    }

    return { data: this.authorization, error: null };
  }

  private async getProviderKeyFromProxy(
    authKey: string,
    env: Env
  ): Promise<
    Result<
      {
        providerKey?: string;
        proxyKeyId?: string;
      },
      string
    >
  > {
    const supabaseClient: SupabaseClient<Database> = createClient(
      this.env.SUPABASE_URL,
      this.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const proxyKey = authKey?.replace("Bearer ", "").trim();
    const regex =
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    const match = proxyKey.match(regex);

    if (!match) {
      return {
        data: null,
        error: "Proxy key id not found",
      };
    }
    const proxyKeyId = match[0];

    //TODO figure out how to make this into one query with this syntax
    // https://supabase.com/docs/guides/api/joins-and-nesting

    const [storedProxyKey, limits] = await Promise.all([
      supabaseClient
        .from("helicone_proxy_keys")
        .select("*")
        .eq("id", proxyKeyId)
        .eq("soft_delete", "false")
        .single(),
      supabaseClient
        .from("helicone_proxy_key_limits")
        .select("*")
        .eq("helicone_proxy_key", proxyKeyId),
    ]);

    if (storedProxyKey.error || !storedProxyKey.data) {
      return {
        data: null,
        error: "Proxy key not found in storedProxyKey",
      };
    }

    if (limits.data && limits.data.length > 0) {
      console.log("CHECKING LIMITS");
      if (!(await checkLimits(limits.data, env))) {
        return {
          data: null,
          error: "Limits are not valid",
        };
      }
    } else {
      console.log("NO LIMITS");
    }

    const verified = await supabaseClient.rpc("verify_helicone_proxy_key", {
      api_key: proxyKey,
      stored_hashed_key: storedProxyKey.data.helicone_proxy_key,
    });

    if (verified.error || !verified.data) {
      return {
        data: null,
        error: "Proxy key not verified",
      };
    }

    const providerKey = await supabaseClient
      .from("decrypted_provider_keys")
      .select("decrypted_provider_key")
      .eq("id", storedProxyKey.data.provider_key_id)
      .eq("soft_delete", "false")
      .single();

    if (providerKey.error || !providerKey.data?.decrypted_provider_key) {
      return {
        data: null,
        error: "Provider key not found",
      };
    }

    return {
      data: {
        providerKey: providerKey.data.decrypted_provider_key,
        proxyKeyId: storedProxyKey.data.id,
      },
      error: null,
    };
  }
}
