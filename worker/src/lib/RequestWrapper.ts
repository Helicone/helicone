// This request wrapper allows us to mock the request object in tests.
// It also allows us to add additional functionality to the request object
// without modifying the request object itself.
// This also allows us to not have to redefine other objects repetitively like URL.
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { hash } from "..";
import { Database } from "../../supabase/database.types";
import { HeliconeAuth } from "./db/DBWrapper";
import {
  checkLimits,
  checkLimitsSingle,
} from "./managers/UsageLimitManager.ts";
import {
  HeliconeHeaders,
  HeliconeTokenLimitExceptionHandler,
} from "./models/HeliconeHeaders";
import {
  applyFallbackStrategy,
  applyMiddleOutStrategy,
  applyTruncateStrategy,
  estimateTokenCount,
  getModelTokenLimit,
  parseRequestPayload,
  resolvePrimaryModel,
} from "./util/tokenLimitException";
import { Provider } from "@helicone-package/llm-mapper/types";
import { getAndStoreInCache } from "./util/cache/secureCache";
import { Result, err, map, mapPostgrestErr, ok } from "./util/results";
import { parseJSXObject } from "@helicone/prompts";
import { HELICONE_API_KEY_REGEX } from "./util/apiKeyRegex";
import { Attempt } from "./ai-gateway/types";
import { DataDogClient, getDataDogClient } from "./monitoring/DataDogClient";
import {
  IRequestBodyBuffer,
  ValidRequestBody,
} from "../RequestBodyBuffer/IRequestBodyBuffer";
import { RequestBodyBufferBuilder } from "../RequestBodyBuffer/RequestBodyBufferBuilder";

export type RequestHandlerType =
  | "proxy_only"
  | "proxy_log"
  | "logging"
  | "feedback";

// LEGACY PROMPTS
export type PromptSettings =
  | {
      promptId: string;
      promptVersion: string;
      promptMode: "production" | "testing";
      promptInputs?: Record<string, string>;
    }
  | {
      promptId: undefined;
      promptVersion: string;
      promptMode: "testing" | "deactivated";
      promptInputs?: Record<string, string>;
    };

export type Prompt2025Settings = {
  promptId?: string;
  promptVersionId?: string;
  environment?: string;
  promptInputs?: Record<string, any>;
};

export class RequestWrapper {
  private authorization: string | undefined;
  url: URL;
  originalUrl: URL;
  heliconeHeaders: HeliconeHeaders;
  providerAuth: string | undefined;
  headers: Headers;
  heliconeProxyKeyId: string | undefined;
  baseURLOverride: string | null;
  cf: CfProperties | undefined;
  promptSettings: PromptSettings;
  prompt2025Settings: Prompt2025Settings; // I'm sorry. Will clean whenever we can remove old promtps.
  extraHeaders: Headers | null = null;
  requestReferrer: string | undefined;

  private bodyKeyOverride: object | null = null;

  private gatewayAttempt?: Attempt;

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
          return headers;
        }
      }

      return headers;
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

  // TODO we reallllyyyy should not be calling this.. it's hacky
  public resetObject() {
    this.url = new URL(this.originalUrl);
    this.headers = this.mutatedAuthorizationHeaders(this.request);
    this.heliconeHeaders = new HeliconeHeaders(this.headers);
    this.promptSettings = this.getPromptSettings();
    this.injectPromptProperties();
  }

  private constructor(
    private request: Request,
    private env: Env,
    readonly requestBodyBuffer: IRequestBodyBuffer,
    private readonly dataDogClient: DataDogClient | undefined
  ) {
    this.url = new URL(request.url);
    this.originalUrl = new URL(request.url);
    this.headers = this.mutatedAuthorizationHeaders(request);
    this.heliconeHeaders = new HeliconeHeaders(this.headers);
    this.promptSettings = this.getPromptSettings();
    this.prompt2025Settings = {}; // initialized later, if a prompt is used.
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

    // Initialize with undefined promptInputs - will be set explicitly via setPromptInputs
    return {
      promptId,
      promptVersion,
      promptMode,
      promptInputs: undefined,
    } as PromptSettings;
  }

  static async create(
    request: Request,
    env: Env
  ): Promise<Result<RequestWrapper, string>> {
    let dataDogClient: DataDogClient | undefined;
    // Get DataDog client singleton (persists across all requests)
    if ((env.DATADOG_ENABLED ?? "false") === "true") {
      dataDogClient = getDataDogClient(env);
    }
    const requestBodyBuffer = await RequestBodyBufferBuilder(
      request,
      dataDogClient,
      env
    );
    const requestWrapper = new RequestWrapper(
      request,
      env,
      requestBodyBuffer,
      dataDogClient
    );
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

  setRequestReferrer(referrer: string): void {
    this.requestReferrer = referrer;
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

  async applyBodyOverrides(): Promise<void> {
    const overrides: Record<string, any> = {};

    if (this.bodyKeyOverride) {
      Object.assign(overrides, this.bodyKeyOverride);
    }

    if (this.heliconeHeaders.featureFlags.streamUsage) {
      if (!overrides["stream_options"]) {
        overrides["stream_options"] = {};
      }
      overrides["stream_options"]["include_usage"] = true;
    }

    if (Object.keys(overrides).length > 0) {
      await this.requestBodyBuffer.setBodyOverride(overrides);
    }
  }

  async applyTokenLimitExceptionHandler(provider: Provider): Promise<void> {
    const handler = this.heliconeHeaders.tokenLimitExceptionHandler;
    if (!handler) {
      return;
    }

    const bodyText = await this.requestBodyBuffer.unsafeGetRawText();
    const parsedBody = parseRequestPayload(bodyText);
    if (!parsedBody) {
      return;
    }

    const primaryModel = resolvePrimaryModel(
      parsedBody,
      this.heliconeHeaders.modelOverride
    );

    if (!primaryModel) {
      return;
    }

    const estimatedTokens = estimateTokenCount(parsedBody, primaryModel);
    const modelContextLimit = getModelTokenLimit(provider, primaryModel);

    // Extract requested completion/output limit (provider-agnostic best-effort)
    const anyBody = parsedBody as any;
    const completionCandidates: Array<unknown> = [
      anyBody?.max_completion_tokens,
      anyBody?.max_tokens,
      anyBody?.max_output_tokens,
      anyBody?.maxOutputTokens,
      anyBody?.response?.max_tokens,
      anyBody?.response?.max_output_tokens,
      anyBody?.response?.maxOutputTokens,
      anyBody?.generation_config?.max_output_tokens,
      anyBody?.generation_config?.maxOutputTokens,
      anyBody?.generationConfig?.max_output_tokens,
      anyBody?.generationConfig?.maxOutputTokens,
    ];
    const requestedCompletionTokens = (() => {
      for (const val of completionCandidates) {
        if (typeof val === "number" && Number.isFinite(val) && val > 0) {
          return Math.floor(val);
        }
      }
      return 0;
    })();
    const tokenLimit =
      modelContextLimit === null
        ? null
        : Math.max(
            0,
            modelContextLimit -
              (requestedCompletionTokens || modelContextLimit * 0.1)
          );

    // For Fallback strategy, we proceed even if tokenLimit is null (model not in registry)
    // because we can still switch to the fallback model based on the model list
    const shouldSkip =
      estimatedTokens === null ||
      (handler === HeliconeTokenLimitExceptionHandler.Fallback
        ? false // Never skip for Fallback - always try to apply it
        : tokenLimit === null ||
          estimatedTokens <= tokenLimit);

    if (shouldSkip) {
      return;
    }

    let modifiedBody: ValidRequestBody | undefined;
    switch (handler) {
      case HeliconeTokenLimitExceptionHandler.Truncate:
        modifiedBody = applyTruncateStrategy(parsedBody, primaryModel, tokenLimit);
        break;
      case HeliconeTokenLimitExceptionHandler.MiddleOut:
        modifiedBody = applyMiddleOutStrategy(parsedBody, primaryModel, tokenLimit);
        break;
      case HeliconeTokenLimitExceptionHandler.Fallback:
        modifiedBody = applyFallbackStrategy(
          parsedBody,
          primaryModel,
          estimatedTokens,
          tokenLimit // Can be null if model not in registry
        );
        break;
    }

    if (typeof modifiedBody === "string") {
      await this.requestBodyBuffer.tempSetBody(modifiedBody);
    }
  }

  // TODO deprecate this function
  async unsafeGetRawText(): Promise<string> {
    return this.requestBodyBuffer.unsafeGetRawText();
  }

  getDataDogClient(): DataDogClient | undefined {
    return this.dataDogClient;
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

  async safelyGetBody(): Promise<ValidRequestBody> {
    if (this.shouldFormatPrompt()) {
      throw new Error(
        "Cannot safely get body for request using legacy prompts"
      );
    }

    await this.applyBodyOverrides();
    return await this.requestBodyBuffer.getReadableStreamToBody();
  }

  async unsafeGetBodyText(): Promise<string> {
    await this.applyBodyOverrides();

    // Unsafely load text from buffer post-overrides
    const text = await this.unsafeGetRawText();

    // Legacy prompts (todo: remove) unfortunately we load into memory here
    if (this.shouldFormatPrompt()) {
      const { objectWithoutJSXTags } = parseJSXObject(JSON.parse(text));
      return JSON.stringify(objectWithoutJSXTags);
    }

    return text;
  }

  // TODO: change func and its references to use safelyGetBody
  async unsafeGetJson<T>(): Promise<T> {
    try {
      return JSON.parse(await this.unsafeGetBodyText());
    } catch (e) {
      console.error(
        "RequestWrapper.getJson",
        e,
        await this.unsafeGetBodyText()
      );
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

  setUrl(url: string): void {
    this.url = new URL(url);
  }

  async signAWSRequest({
    region,
    forwardToHost,
  }: {
    region: string;
    forwardToHost: string;
  }) {
    const { newHeaders, model } = await this.requestBodyBuffer.signAWSRequest({
      region,
      forwardToHost,
      requestHeaders: Object.fromEntries(this.headers.entries()),
      method: this.request.method,
      urlString: this.url.toString(),
    });

    // Add model override header if model was found
    if (model) {
      this.heliconeHeaders.setModelOverride(model);
    }

    this.remapHeaders(newHeaders);
  }

  public removeBedrock(): void {
    const newUrl = new URL(this.url);
    newUrl.pathname = newUrl.pathname
      .split("/v1/")[1]
      .split("/")
      .slice(1)
      .join("/");

    this.setUrl(newUrl.toString());
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

    if (!HELICONE_API_KEY_REGEX.some((pattern) => pattern.test(apiKey))) {
      return err("API Key is not well formed");
    }
    return ok(null);
  }

  getRawProviderAuthHeader(): string | undefined {
    let auth = this.authorization;
    if (auth?.startsWith("Bearer ")) {
      auth = auth.split(" ")[1];
    }
    return auth;
  }

  async getProviderAuthHeader(): Promise<string | undefined> {
    return this.authorization ? await hash(this.authorization) : undefined;
  }

  async getUserId(): Promise<string | undefined> {
    const userId =
      this.heliconeHeaders.userId || (await this.requestBodyBuffer.userId());
    return userId;
  }

  getAuthorization(): string | undefined {
    return this.authorization || undefined;
  }

  setProviderAuthKey(key: string): void {
    this.providerAuth = key;
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
        await getProviderKeyFromPortalKey(authKey, env, supabaseClient),
      43200 // 12 hours
    );
  }

  /**
   * Sets prompt inputs directly on the promptSettings object
   * @param inputs The inputs to associate with the prompt
   */
  setPromptInputs(inputs: Record<string, string>): void {
    this.promptSettings = {
      ...this.promptSettings,
      promptInputs: inputs,
    };
  }

  /**
   * Sets prompts settings (new prompts)
   * @param promptVersionId The version id of the prompt
   * @param environment The environment of the prompt
   * @param inputs The inputs to associate with the prompt
   */
  setPrompt2025Settings(params: {
    promptId: string;
    promptVersionId: string;
    inputs: Record<string, any>;
    environment?: string;
  }): void {
    this.prompt2025Settings = {
      promptId: params.promptId,
      promptVersionId: params.promptVersionId,
      promptInputs: params.inputs,
      environment: params.environment,
    };
  }

  async setBody(body: string): Promise<void> {
    await this.requestBodyBuffer.tempSetBody(body);
  }

  setGatewayAttempt(attempt: Attempt): void {
    this.gatewayAttempt = attempt;
  }

  getGatewayAttempt(): Attempt | undefined {
    return this.gatewayAttempt;
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

export async function getProviderKeyFromProxyCache(
  authKey: string,
  env: Env,
  supabaseClient: SupabaseClient<Database>
): Promise<Result<ProxyKeyRow, string>> {
  return await getAndStoreInCache(
    `getProxyKey-${authKey}`,
    env,
    async () => await getProviderKeyFromProxy(authKey, env, supabaseClient),
    43200 // 12 hours
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
    (organization.data?.limits as any)?.["cost"] ?? -1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (organization.data?.limits as any)?.["requests"] ?? -1,
    "month",
    apiKey.data?.organization_id ?? "",
    env
  );

  if (check.error) {
    return err(check.error);
  }

  const providerKey = await supabaseClient
    .from("decrypted_provider_keys_v2")
    .select("decrypted_provider_key")
    .eq("id", providerKeyId.data?.id ?? "")
    .eq("soft_delete", false)
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
      .eq("soft_delete", false)
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
    if (!(await checkLimits(limits.data, env))) {
      return err("Limits are not valid");
    }
  }

  // @ts-ignore - RPC function not included in generated database types
  const verified = await supabaseClient.rpc("verify_helicone_proxy_key", {
    api_key: proxyKey,
    stored_hashed_key: storedProxyKey.data.helicone_proxy_key,
  });

  if (verified.error || !verified.data) {
    return err("Proxy key not verified");
  }

  const providerKey = await supabaseClient
    .from("decrypted_provider_keys_v2")
    .select("decrypted_provider_key")
    .eq("id", storedProxyKey.data.provider_key_id)
    .eq("soft_delete", false)
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
