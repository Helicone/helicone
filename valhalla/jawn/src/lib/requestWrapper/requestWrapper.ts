// This request wrapper allows us to mock the request object in tests.
// It also allows us to add additional functionality to the request object
// without modifying the request object itself.
// This also allows us to not have to redefine other objects repetitively like URL.

import { Request } from "express";
import { usageLimitManager } from "../../managers/UsageLimitManager";

import { parseJSXObject } from "@helicone/prompts";
import { Headers } from "node-fetch";
import { Readable as ReadableStream } from "stream";
import { getAndStoreInCache } from "../cache/staticMemCache";
import { hashAuth } from "../db/hash";
import { dbExecute } from "../shared/db/dbExecute";
import { map, ok, Result, err } from "../shared/result";

import { HeliconeHeaders } from "../../../../../shared/proxy/heliconeHeaders";
import { HeliconeAuth } from "../../../../../shared/proxy/types/heliconeAuth";

export type RequestHandlerType =
  | "proxy_only"
  | "proxy_log"
  | "logging"
  | "feedback";

export type PromptSettings =
  | { promptId: string; promptMode: "production" | "testing" }
  | { promptId: undefined; promptMode: "testing" | "deactivated" };

export class RequestWrapper {
  private authorization: string | undefined;
  url: URL;
  heliconeHeaders: HeliconeHeaders<Headers>;
  providerAuth: string | undefined;
  headers: Headers;
  heliconeProxyKeyId: string | undefined;
  baseURLOverride: string | null;
  promptSettings: PromptSettings;

  private cachedText: string | null = null;
  private bodyKeyOverride: object | null = null;

  /*
  We allow the Authorization header to take both the provider key and the helicone auth key comma seprated.
  like this (Bearer sk-123, Beaer helicone-sk-123)
  */
  private mutatedAuthorizationHeaders(request: Request): Headers {
    const HELICONE_KEY_ID = "sk-helicone-";
    const authorization = request.headers["authorization"];

    // Convert IncomingHttpHeaders to an array of key-value pairs
    const headersArray = Object.entries(request.headers) as [string, string][];
    const headers = new Headers(headersArray);

    if (!authorization) {
      return headers;
    }

    if (
      !authorization.includes(",") ||
      !authorization.includes(HELICONE_KEY_ID)
    ) {
      return headers;
    }

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
      headers.set("authorization", providerAuth);
    }
    if (heliconeAuth) {
      headers.set("helicone-auth", heliconeAuth);
    }

    return headers;
  }

  private constructor(private request: Request) {
    const protocol = request.protocol;
    const host = request.get("host");
    const fullUrl = `${protocol}://${host}${request.originalUrl}`;
    this.url = new URL(fullUrl);
    this.headers = this.mutatedAuthorizationHeaders(request);
    this.heliconeHeaders = new HeliconeHeaders(this.headers);
    this.promptSettings = this.getPromptSettings();
    this.injectPromptProperties();
    this.baseURLOverride = null;
  }

  private injectPromptProperties() {
    const promptId = this.promptSettings.promptId;
    if (promptId) {
      this.heliconeHeaders.heliconeProperties[`Helicone-Prompt-Id`] = promptId;
    }
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
    const promptMode = this.getPromptMode(
      promptId,
      this.heliconeHeaders.promptHeaders.promptMode ?? undefined
    );

    return {
      promptId,
      promptMode,
    } as PromptSettings;
  }

  static async create(
    request: Request
  ): Promise<Result<RequestWrapper, string>> {
    const requestWrapper = new RequestWrapper(request);
    const authorization = await requestWrapper.setAuthorization();

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
    this.cachedText = JSON.stringify(this.request.body);
    return this.cachedText;
  }

  shouldFormatPrompt(): boolean {
    return (
      this.promptSettings.promptMode === "production" ||
      this.promptSettings.promptMode === "testing"
    );
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
      const text = await this.getText();
      return JSON.parse(text);
    } catch (e) {
      console.error("RequestWrapper.getJson", e, await this.getText());
      throw new Error("Failed to parse JSON");
    }
  }

  async getFormData(): Promise<Result<Express.Multer.File[], string>> {
    const contentType = this.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return err("Content type must be multipart/form-data");
    }

    const files = this.request.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return err("No files found in the form data");
    }

    return ok(files);
  }

  getBody(): ReadableStream {
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
    const apiKeyPattern =
      /^sk-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/;
    const apiKeyPatternV2 =
      /^sk-helicone-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/;
    const apiKeyPatternV3 =
      /^sk-helicone-cp-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}-[a-z0-9]{7}$/;

    if (
      !(
        apiKeyPattern.test(apiKey) ||
        apiKeyPatternV2.test(apiKey) ||
        apiKeyPatternV3.test(apiKey)
      )
    ) {
      return err("API Key is not well formed");
    }
    return ok(null);
  }

  async getProviderAuthHeader(): Promise<string | undefined> {
    return this.authorization ? await hashAuth(this.authorization) : undefined;
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

  private async setAuthorization(): Promise<
    Result<string | undefined, string>
  > {
    if (this.authorization) {
      return { data: this.authorization, error: null };
    }

    const authKey =
      this.headers.get("Authorization") ?? // Openai
      this.headers.get("x-api-key") ?? // Anthropic
      this.headers.get("api-key") ?? // Azure
      undefined;

    // If using proxy key, get the real key from vault
    if (authKey?.startsWith("Bearer sk-helicone-cp")) {
      const { data, error } = await this.getProviderKeyFromCustomerPortalKey(
        authKey
      );

      if (error || !data || !data.providerKey) {
        return err(
          `Provider key not found using Customer Portal Key. Error: ${error}`
        );
      }
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
      (process.env.VAULT_ENABLED ?? "false") === "true" &&
      authKey?.startsWith("Bearer sk-helicone-proxy")
    ) {
      const { data, error } = await this.getProviderKeyFromProxy(authKey);

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
    authKey: string
  ): Promise<Result<ProxyKeyRow, string>> {
    const proxyKey = authKey?.replace("Bearer ", "").trim();
    return getHeliconeProxyKeyVerify(proxyKey);
  }

  private async getProviderKeyFromCustomerPortalKey(
    authKey: string
  ): Promise<Result<CustomerPortalValues, string>> {
    return await getAndStoreInCache(
      `getProxy-CP-${authKey}`,

      async () => await getProviderKeyFromPortalKey(authKey)
    );
  }

  public getRequest(): Request {
    return this.request;
  }
}

interface CustomerPortalValues {
  providerKey: string;
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
  authKey: string
): Promise<Result<ProxyKeyRow, string>> {
  const proxyKey = authKey?.replace("Bearer ", "").trim();
  return getAndStoreInCache(
    `get-provider-key-from-proxy:${proxyKey}`,
    async () => await getHeliconeProxyKeyVerify(proxyKey)
  );
}

export interface ProxyKeyRow {
  providerKey: string;
  proxyKeyId: string;
  organizationId: string;
}

export async function getProviderKeyFromPortalKey(
  authKey: string
): Promise<Result<CustomerPortalValues, string>> {
  try {
    // Get the API key
    const apiKeyResult = await dbExecute<{ organization_id: string }>(
      `SELECT organization_id
       FROM helicone_api_keys
       WHERE api_key_hash = $1
       LIMIT 1`,
      [await hashAuth(authKey)]
    );

    if (
      apiKeyResult.error ||
      !apiKeyResult.data ||
      apiKeyResult.data.length === 0
    ) {
      return err("API key not found");
    }

    const organizationId = apiKeyResult.data[0].organization_id;

    // Get the organization
    const orgResult = await dbExecute<{
      id: string;
      org_provider_key: string;
      limits: any;
    }>(
      `SELECT id, org_provider_key, limits
       FROM organization
       WHERE id = $1
       LIMIT 1`,
      [organizationId]
    );

    if (orgResult.error || !orgResult.data || orgResult.data.length === 0) {
      return err("Organization not found");
    }

    const providerKeyId = orgResult.data[0].org_provider_key;

    // Check usage limits
    const check = await usageLimitManager.checkLimitsSingle(
      (orgResult.data[0].limits as any)["cost"],
      (orgResult.data[0].limits as any)["requests"],
      "month",
      organizationId
    );

    if (check.error) {
      return err(check.error);
    }

    // Get the provider key
    const providerKeyResult = await dbExecute<{
      decrypted_provider_key: string;
    }>(
      `SELECT decrypted_provider_key
       FROM decrypted_provider_keys
       WHERE id = $1
       AND soft_delete = false
       LIMIT 1`,
      [providerKeyId]
    );

    if (
      providerKeyResult.error ||
      !providerKeyResult.data ||
      providerKeyResult.data.length === 0
    ) {
      return err("Provider key not found");
    }

    return ok({
      providerKey: providerKeyResult.data[0].decrypted_provider_key,
    });
  } catch (error) {
    console.error("Error getting provider key from portal key:", error);
    return err(String(error));
  }
}

export async function getProviderKeyFromProxy(
  authKey: string
): Promise<Result<ProxyKeyRow, string>> {
  const proxyKey = authKey?.replace("Bearer ", "").trim();
  return getHeliconeProxyKeyVerify(proxyKey);
}

async function getHeliconeProxyKeyVerify(
  proxyKey: string
): Promise<Result<ProxyKeyRow, string>> {
  const match = proxyKey.match(
    /sk-proxy-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/
  );
  if (!match) {
    return {
      data: null,
      error: "Proxy key id not found",
    };
  }
  const proxyKeyId = match[0];

  try {
    // Fetch both the proxy key and its limits
    const [proxyKeyResult, limitsResult] = await Promise.all([
      dbExecute<{
        id: string;
        helicone_proxy_key: string;
        provider_key_id: string;
        org_id: string;
      }>(
        `SELECT id, helicone_proxy_key, provider_key_id, org_id
         FROM helicone_proxy_keys
         WHERE id = $1
         AND soft_delete = false
         LIMIT 1`,
        [proxyKeyId]
      ),
      dbExecute<{
        id: string;
        helicone_proxy_key: string;
        cost: number | null;
        count: number | null;
        created_at: string | null;
        currency: string | null;
        timewindow_seconds: number | null;
      }>(
        `SELECT id, helicone_proxy_key, 
         cost_limit_ceiling as cost, 
         rate_limit_ceiling as count, 
         created_at, 
         'USD' as currency, 
         EXTRACT(EPOCH FROM (cost_limit_ceiling_restart - created_at)) as timewindow_seconds
         FROM helicone_proxy_key_limits
         WHERE helicone_proxy_key = $1`,
        [proxyKeyId]
      ),
    ]);

    if (
      proxyKeyResult.error ||
      !proxyKeyResult.data ||
      proxyKeyResult.data.length === 0
    ) {
      return err("Proxy key not found");
    }

    const storedProxyKey = proxyKeyResult.data[0];

    // Check limits if they exist
    if (limitsResult.data && limitsResult.data.length > 0) {
      console.log("CHECKING LIMITS");
      if (!(await usageLimitManager.checkLimits(limitsResult.data))) {
        return err("Limits are not valid");
      }
    }

    // Verify the proxy key
    const verifyResult = await dbExecute<{ result: boolean }>(
      `SELECT verify_helicone_proxy_key($1, $2) as result`,
      [proxyKey, storedProxyKey.helicone_proxy_key]
    );

    if (
      verifyResult.error ||
      !verifyResult.data ||
      verifyResult.data.length === 0 ||
      !verifyResult.data[0].result
    ) {
      return err("Proxy key not verified");
    }

    // Get the provider key
    const providerKeyResult = await dbExecute<{
      decrypted_provider_key: string;
    }>(
      `SELECT decrypted_provider_key
       FROM decrypted_provider_keys
       WHERE id = $1
       AND soft_delete = false
       LIMIT 1`,
      [storedProxyKey.provider_key_id]
    );

    if (
      providerKeyResult.error ||
      !providerKeyResult.data ||
      providerKeyResult.data.length === 0
    ) {
      return err("Provider key not found");
    }

    return ok({
      providerKey: providerKeyResult.data[0].decrypted_provider_key,
      proxyKeyId: storedProxyKey.id,
      organizationId: storedProxyKey.org_id,
    });
  } catch (error) {
    console.error("Error verifying proxy key:", error);
    return err(String(error));
  }
}
