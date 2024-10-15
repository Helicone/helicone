// This request wrapper allows us to mock the request object in tests.
// It also allows us to add additional functionality to the request object
// without modifying the request object itself.
// This also allows us to not have to redefine other objects repetitively like URL.
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env, hash } from "..";
import { Database } from "../../supabase/database.types";
import { HeliconeAuth } from "./db/DBWrapper";
import { Result, err, map, mapPostgrestErr, ok } from "./util/results";
import { HeliconeHeaders } from "./models/HeliconeHeaders";
import {
  checkLimits,
  checkLimitsSingle,
} from "./managers/UsageLimitManager.ts";
import { getAndStoreInCache } from "./util/cache/secureCache";

import { CfProperties } from "@cloudflare/workers-types";
import { parseJSXObject } from "@helicone/prompts";

export type RequestHandlerType =
  | "proxy_only"
  | "proxy_log"
  | "logging"
  | "feedback";

export type PromptSettings =
  | {
      promptId: string;
      promptVersion: string;
      promptMode: "production" | "testing";
    }
  | {
      promptId: undefined;
      promptVersion: string;
      promptMode: "testing" | "deactivated";
    };

export class RequestWrapper {
  private authorization: string | undefined;
  url: URL;
  heliconeHeaders: HeliconeHeaders;
  providerAuth: string | undefined;
  headers: Headers;
  heliconeProxyKeyId: string | undefined;
  baseURLOverride: string | null;
  cf: CfProperties | undefined;
  promptSettings: PromptSettings;
  extraHeaders: Headers | null = null;

  private cachedText: string | null = null;
  private bodyKeyOverride: object | null = null;

  /*
  We allow the Authorization header to take both the provider key and the helicone auth key comma seprated.
  like this (Bearer sk-123, Beaer helicone-sk-123)
  */
  private mutatedAuthorizationHeaders(request: Request): Headers {
    const HELICONE_KEY_ID = "sk-helicone-";
    const HELICONE_PUBLIC_KEY_ID = "pk-helicone-";
    const headers = new Headers(request.headers);
    const authorization = request.headers.get("Authorization");

    if (
      !authorization ||
      !authorization.includes(",") ||
      !authorization.includes(HELICONE_KEY_ID) ||
      !authorization.includes(HELICONE_PUBLIC_KEY_ID)
    ) {
      if (!headers.has("helicone-auth")) {
        try {
          const url = new URL(request.url);
          const urlPath = url.pathname;
          const pathParts = urlPath.split("/");
          const apiKeyIndex = pathParts.findIndex(
            (part) =>
              part.startsWith("sk-helicone") || part.startsWith("pk-helicone")
          );

          if (apiKeyIndex > -1 && apiKeyIndex < pathParts.length) {
            const potentialApiKey = pathParts[apiKeyIndex];
            headers.set("helicone-auth", `Bearer ${potentialApiKey}`);
            pathParts.splice(apiKeyIndex, 1);
            this.url.pathname = pathParts.join("/");
          }

          return headers;
        } catch (error) {
          console.error(`Failed retrieving API key from path: ${error}`);
          return request.headers;
        }
      }

      return request.headers;
    }

    if (headers.has("helicone-auth")) {
      throw new Error(
        "Cannot have both helicone-auth and Helicone Authorization headers"
      );
    }

    const authorizationKeys = authorization.split(",").map((x) => x.trim());

    const heliconeAuth = authorizationKeys.find(
      (x) => x.includes(HELICONE_KEY_ID) || x.includes(HELICONE_PUBLIC_KEY_ID)
    );
    const providerAuth = authorizationKeys.find(
      (x) => !x.includes(HELICONE_KEY_ID) || !x.includes(HELICONE_PUBLIC_KEY_ID)
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
    this.heliconeHeaders = new HeliconeHeaders(this.headers);
    this.promptSettings = this.getPromptSettings();
    this.injectPromptProperties();
    this.baseURLOverride = null;
    this.cf = request.cf;
  }

  private injectPromptProperties() {
    const promptId = this.promptSettings.promptId;
    if (promptId) {
      this.injectCustomProperty(`Helicone-Prompt-Id`, promptId);
    }
  }

  injectCustomProperty(key: string, value: string): void {
    this.heliconeHeaders.heliconeProperties[key] = value;
  }

  private getPromptMode(
    promptId?: string,
    promptMode?: string
  ): PromptSettings["promptMode"] {
    const validPromptModes = ["production", "testing", "deactivated"];

    if (promptMode && !validPromptModes.includes(promptMode)) {
      throw new Error("Invalid prompt mode");
    }

    if (promptMode) {
      return promptMode as PromptSettings["promptMode"];
    }

    if (!promptMode && promptId) {
      return "production";
    }

    return "deactivated";
  }

  private getPromptSettings(): PromptSettings {
    const promptId = this.heliconeHeaders.promptHeaders.promptId ?? undefined;
    const promptVersion =
      this.heliconeHeaders.promptHeaders.promptVersion ?? "";
    const promptMode = this.getPromptMode(
      promptId,
      this.heliconeHeaders.promptHeaders.promptMode ?? undefined
    );

    return {
      promptId,
      promptVersion,
      promptMode,
    } as PromptSettings;
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

  async auth(): Promise<Result<HeliconeAuth, string>> {
    if (!this.heliconeHeaders.heliconeAuthV2?._type) {
      return err("invalid auth key");
    }
    const tokenType = this.heliconeHeaders.heliconeAuthV2._type;
    const token = this.heliconeHeaders.heliconeAuthV2.token;

    if (tokenType === "jwt") {
      return ok({
        _type: "jwt",
        token,
        orgId: this.heliconeHeaders.heliconeAuthV2.orgId,
      });
    } else if (tokenType === "bearer" && this.heliconeProxyKeyId) {
      return ok({
        _type: "bearerProxy",
        token,
      });
    } else if (tokenType === "bearer") {
      const res = await this.validateHeliconeAuthHeader(
        this.heliconeHeaders.heliconeAuthV2.token ?? this.authorization
      );
      if (res.error) {
        return err(res.error);
      }
      return ok({ _type: "bearer", token });
    }
    throw new Error("Unreachable");
  }

  setBodyKeyOverride(bodyKeyOverride: object): void {
    this.bodyKeyOverride = bodyKeyOverride;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async getRawText(): Promise<string> {
    if (this.cachedText) {
      return this.cachedText;
    }
    this.cachedText = await this.request.text();
    return this.cachedText;
  }

  shouldFormatPrompt(): boolean {
    return (
      this.promptSettings.promptMode === "production" ||
      this.promptSettings.promptMode === "testing"
    );
  }

  isEU(): boolean {
    const url = new URL(this.getUrl());
    const host = url.host;
    const hostParts = host.split(".");
    const auth = this.heliconeHeaders.heliconeAuthV2?.token;
    return !!hostParts.includes("eu") || !!auth?.includes("helicone-eu");
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
    } else if (this.shouldFormatPrompt()) {
      const { objectWithoutJSXTags } = parseJSXObject(JSON.parse(text));

      return JSON.stringify(objectWithoutJSXTags);
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

  async getFormData(): Promise<Result<FormData, string>> {
    const contentType = this.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return err("Content type must be multipart/form-data");
    }

    const formData = await this.request.formData();
    return ok(formData);
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

  private async validateHeliconeAuthHeader(
    heliconeAuth: string
  ): Promise<Result<null, string>> {
    if (!heliconeAuth) {
      return { data: null, error: null };
    }
    if (!heliconeAuth.includes("Bearer ")) {
      return { data: null, error: "Must included Bearer in API Key" };
    }

    const apiKey = heliconeAuth.replace("Bearer ", "").trim();
    const apiKeyPatterns = [
      /^sk-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^sk-helicone-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^sk-helicone-cp-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^pk-helicone-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^pk-helicone-cp-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^pk-helicone-eu-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^pk-helicone-cp-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^pk-helicone-eu-cp-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^sk-helicone-eu-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^sk-helicone-cp-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^sk-helicone-eu-cp-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/,
      /^[sp]k(-helicone)?(-eu)?(-cp)?-\w{7}-\w{7}-\w{7}-\w{7}$/,
    ];

    // We can probably do something like this... but i am scared lol
    // const apiKeyPattern = /^(sk|pk)(-helicone)?(-(cp|eu|eu-cp))?-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/;

    if (!apiKeyPatterns.some((pattern) => pattern.test(apiKey))) {
      return err("API Key is not well formed");
    }
    return ok(null);
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
    if (authKey?.includes("-cp-")) {
      const { data, error } = await this.getProviderKeyFromCustomerPortalKey(
        authKey,
        env
      );

      if (error || !data || !data.providerKey) {
        return err(
          `Provider key not found using Customer Portal Key. Error: ${error}`
        );
      }
      this.extraHeaders = new Headers();
      this.extraHeaders.set("helicone-organization-id", data.heliconeOrgId);

      this.extraHeaders.set(
        "helicone-request-id",
        this.heliconeHeaders.requestId
      );

      this.authorization = data.providerKey;
      const headers = new Headers(this.headers);
      headers.set("Authorization", `Bearer ${this.authorization}`);
      this.headers = headers;
      this.heliconeHeaders.heliconeAuthV2 = {
        token: authKey,
        _type: "bearer",
      };
      this.heliconeHeaders.heliconeAuth = authKey;
    } else if (
      this.env.VAULT_ENABLED &&
      (authKey?.startsWith("Bearer sk-helicone-proxy") ||
        authKey?.startsWith("Bearer pk-helicone-proxy"))
    ) {
      const { data, error } = await this.getProviderKeyFromProxy(authKey, env);

      if (error || !data || !data.providerKey || !data.proxyKeyId) {
        return err(`Proxy key not found. Error: ${error}`);
      }
      const providerKeyRow = data;

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
  ): Promise<Result<ProxyKeyRow, string>> {
    const supabaseClient: SupabaseClient<Database> = createClient(
      this.env.SUPABASE_URL,
      this.env.SUPABASE_SERVICE_ROLE_KEY
    );
    return getProviderKeyFromProxyCache(authKey, env, supabaseClient);
  }

  private async getProviderKeyFromCustomerPortalKey(
    authKey: string,
    env: Env
  ): Promise<Result<CustomerPortalValues, string>> {
    const supabaseClient: SupabaseClient<Database> = createClient(
      this.env.SUPABASE_URL,
      this.env.SUPABASE_SERVICE_ROLE_KEY
    );

    return await getAndStoreInCache(
      `getProxy-CP-${authKey}`,
      env,
      async () =>
        await getProviderKeyFromPortalKey(authKey, env, supabaseClient)
    );
  }
}

interface CustomerPortalValues {
  providerKey: string;
  heliconeOrgId: string;
}

export interface ProxyKeyRow {
  providerKey: string;
  proxyKeyId: string;
  organizationId: string;
}

export interface ProxyKeyRow {
  providerKey: string;
  proxyKeyId: string;
  organizationId: string;
}
export async function getProviderKeyFromProxyCache(
  authKey: string,
  env: Env,
  supabaseClient: SupabaseClient<Database>
): Promise<Result<ProxyKeyRow, string>> {
  return await getAndStoreInCache(
    `getProxyKey-${authKey}`,
    env,
    async () => await getProviderKeyFromProxy(authKey, env, supabaseClient)
  );
}

export interface ProxyKeyRow {
  providerKey: string;
  proxyKeyId: string;
  organizationId: string;
}

export async function getProviderKeyFromPortalKey(
  authKey: string,
  env: Env,
  supabaseClient: SupabaseClient<Database>
): Promise<Result<CustomerPortalValues, string>> {
  const apiKey = await supabaseClient
    .from("helicone_api_keys")
    .select("*")
    .eq("api_key_hash", await hash(authKey))
    .single();

  const organization = await supabaseClient
    .from("organization")
    .select("*")
    .eq("id", apiKey.data?.organization_id ?? "")
    .single();

  const providerKeyId = await supabaseClient
    .from("provider_keys")
    .select("*")
    .eq("id", organization.data?.org_provider_key ?? "")
    .single();

  const check = await checkLimitsSingle(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (organization.data?.limits as any)["cost"],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (organization.data?.limits as any)["requests"],
    "month",
    apiKey.data?.organization_id ?? "",
    env
  );

  if (check.error) {
    return err(check.error);
  } else {
    console.log("check.data", check.data);
  }

  const providerKey = await supabaseClient
    .from("decrypted_provider_keys")
    .select("decrypted_provider_key")
    .eq("id", providerKeyId.data?.id ?? "")
    .eq("soft_delete", "false")
    .single();

  return map(mapPostgrestErr(providerKey), (x) => ({
    providerKey: x.decrypted_provider_key ?? "",
    heliconeOrgId: apiKey.data?.organization_id ?? "",
  }));
}

export async function getProviderKeyFromProxy(
  authKey: string,
  env: Env,
  supabaseClient: SupabaseClient<Database>
): Promise<Result<ProxyKeyRow, string>> {
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
    return err("Proxy key not found in storedProxyKey");
  }

  if (limits.data && limits.data.length > 0) {
    console.log("CHECKING LIMITS");
    if (!(await checkLimits(limits.data, env))) {
      return err("Limits are not valid");
    }
  }

  const verified = await supabaseClient.rpc("verify_helicone_proxy_key", {
    api_key: proxyKey,
    stored_hashed_key: storedProxyKey.data.helicone_proxy_key,
  });

  if (verified.error || !verified.data) {
    return err("Proxy key not verified");
  }

  const providerKey = await supabaseClient
    .from("decrypted_provider_keys")
    .select("decrypted_provider_key")
    .eq("id", storedProxyKey.data.provider_key_id)
    .eq("soft_delete", "false")
    .single();

  if (providerKey.error || !providerKey.data?.decrypted_provider_key) {
    return err("Provider key not found");
  }

  return ok({
    providerKey: providerKey.data.decrypted_provider_key,
    proxyKeyId: storedProxyKey.data.id,
    organizationId: storedProxyKey.data.org_id,
  });
}
