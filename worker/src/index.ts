import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { EventEmitter } from "events";
import { Database } from "../supabase/database.types";
import { getCacheSettings } from "./cache";
import { ClickhouseEnv, dbInsertClickhouse } from "./clickhouse";
import { once } from "./helpers";
import { readAndLogResponse } from "./logResponse";
import { ChatPrompt, extractPrompt, Prompt } from "./prompt";
import { handleLoggingEndpoint, isLoggingEndpoint } from "./properties";
import {
  checkRateLimit,
  getRateLimitOptions,
  RateLimitOptions,
  RateLimitResponse,
  updateRateLimitCounter,
} from "./rateLimit";
import { Result } from "./results";
import {
  forwardRequestToOpenAiWithRetry,
  getRetryOptions,
  RetryOptions,
} from "./retry";
import { handleFeedbackEndpoint, isFeedbackEndpoint } from "./feedback";

export interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  TOKENIZER_COUNT_API: string;
  RATE_LIMIT_KV: KVNamespace;
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
}

export interface RequestSettings {
  stream: boolean;
  tokenizer_count_api: string;
  helicone_api_key?: string;
  ff_stream_force_format?: boolean;
  ff_increase_timeout?: boolean;
  api_base?: string;
}

export async function forwardRequestToOpenAi(
  request: Request,
  requestSettings: RequestSettings,
  body?: string,
  retryOptions?: RetryOptions
): Promise<Response> {
  const originalUrl = new URL(request.url);

  const defaultBase = "https://api.openai.com/v1";
  const apiBase = (requestSettings.api_base ?? defaultBase).replace(/\/$/, ""); // remove trailing slash if any
  const apiBaseUrl = new URL(apiBase);

  const new_url = new URL(
    `${apiBaseUrl.origin}${originalUrl.pathname}${originalUrl.search}`
  );
  const headers = removeHeliconeHeaders(request.headers);
  const method = request.method;
  const baseInit = { method, headers };
  const init = method === "GET" ? { ...baseInit } : { ...baseInit, body };

  let response;
  if (requestSettings.ff_increase_timeout) {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => controller.abort(), 1000 * 60 * 30);
    response = await fetch(new_url.href, { ...init, signal });
  } else {
    response = await fetch(new_url.href, init);
  }

  if (retryOptions && (response.status === 429 || response.status === 500)) {
    throw new Error(`Status code ${response.status}`);
  }

  return response;
}

type HeliconeRequest = {
  dbClient: SupabaseClient<Database>;
  request: Request;
  auth: string;
  requestId: string;
  body?: string;
  prompt?: Prompt | ChatPrompt;
  heliconeApiKey?: string;
} & HeliconeHeaders;

interface HeliconeHeaders {
  userId: string | null;
  promptId: string | null;
  properties?: Record<string, string>;
  isPromptRegexOn: boolean;
  promptName: string | null;
}

async function getPromptId(
  dbClient: SupabaseClient,
  prompt: Prompt | ChatPrompt,
  name: string | null,
  auth: string
): Promise<Result<string, string>> {
  // First, get the prompt id if there's a match in the prompt table
  const auth_hash = await hash(auth);
  const { data, error } = await dbClient
    .from("prompt")
    .select("id")
    .eq("auth_hash", auth_hash)
    .eq("prompt", prompt.prompt)
    .limit(1);
  if (error !== null) {
    return { data: null, error: error.message };
  }
  if (data !== null && data.length > 0) {
    return { data: data[0].id, error: null };
  } else {
    let newPromptName;
    if (name) {
      newPromptName = name;
    } else {
      // First, query the database to find the highest prompt name suffix
      const { data: highestSuffixData } = await dbClient
        .from("prompt")
        .select("name")
        .order("name", { ascending: false })
        .like("name", "Prompt (%)")
        .eq("auth_hash", auth_hash)
        .limit(1)
        .single();

      // Extract the highest suffix number from the highest prompt name suffix found
      let highestSuffix = 0;
      if (highestSuffixData) {
        const matches = highestSuffixData.name.match(/\((\d+)\)/);
        if (matches) {
          highestSuffix = parseInt(matches[1]);
        }
      }

      // Increment the highest suffix to get the new suffix for the new prompt name
      const newSuffix = highestSuffix + 1;

      // Construct the new prompt name with the new suffix
      newPromptName = `Prompt (${newSuffix})`;
    }

    // If there's no match, insert the prompt and get the id
    const { data, error } = await dbClient
      .from("prompt")
      .insert([
        {
          id: crypto.randomUUID(),
          prompt: prompt.prompt,
          name: newPromptName,
          auth_hash: auth_hash,
        },
      ])
      .select("id")
      .single();
    if (error !== null) {
      return { data: null, error: error.message };
    }
    return { data: data.id, error: null };
  }
}

async function getHeliconeApiKeyRow(
  dbClient: SupabaseClient<Database>,
  heliconeApiKey?: string
) {
  if (!heliconeApiKey) {
    return { data: null, error: "No helicone api key" };
  }
  if (!heliconeApiKey.includes("Bearer ")) {
    return { data: null, error: "Must included Bearer in API Key" };
  }
  const apiKey = heliconeApiKey.replace("Bearer ", "").trim();
  const apiKeyHash = await hash(`Bearer ${apiKey}`);
  const { data, error } = await dbClient
    .from("helicone_api_keys")
    .select("*")
    .eq("api_key_hash", apiKeyHash)
    .eq("soft_delete", false)
    .single();

  if (error !== null) {
    return { data: null, error: error.message };
  }
  return { data: data, error: null };
}

async function logRequest({
  dbClient,
  request,
  userId,
  promptId,
  requestId,
  auth,
  body,
  properties,
  prompt,
  promptName,
  heliconeApiKey,
}: HeliconeRequest): Promise<
  Result<
    {
      request: Database["public"]["Tables"]["request"]["Row"];
      properties: Database["public"]["Tables"]["properties"]["Row"][];
    },
    string
  >
> {
  try {
    const json = body ? JSON.parse(body) : {};
    const jsonUserId = json.user;

    const formattedPromptResult =
      prompt !== undefined
        ? await getPromptId(dbClient, prompt, promptName, auth)
        : null;
    if (
      formattedPromptResult !== null &&
      formattedPromptResult.error !== null
    ) {
      return { data: null, error: formattedPromptResult.error };
    }
    const formattedPromptId =
      formattedPromptResult !== null ? formattedPromptResult.data : null;
    const prompt_values = prompt !== undefined ? prompt.values : null;
    const hashed_auth = await hash(auth);

    const { data: heliconeApiKeyRow, error: userIdError } =
      await getHeliconeApiKeyRow(dbClient, heliconeApiKey);
    if (userIdError !== null) {
      console.error(userIdError);
    }

    // TODO - once we deprecate using OpenAI API keys, we can remove this
    // if (userIdError !== null) {
    //   return { data: null, error: userIdError };
    // }

    const { data, error } = await dbClient
      .from("request")
      .insert([
        {
          id: requestId,
          path: request.url,
          body: json,
          auth_hash: hashed_auth,
          user_id: jsonUserId ?? userId,
          prompt_id: promptId,
          properties: properties,
          formatted_prompt_id: formattedPromptId,
          prompt_values: prompt_values,
          helicone_user: heliconeApiKeyRow?.user_id,
          helicone_api_key_id: heliconeApiKeyRow?.id,
          helicone_org_id: heliconeApiKeyRow?.organization_id,
        },
      ])
      .select("*")
      .single();

    if (error !== null) {
      return { data: null, error: error.message };
    } else {
      // Log custom properties and then return request id
      const customPropertyRows = Object.entries(properties ?? {}).map(
        (entry) => ({
          request_id: requestId,
          auth_hash: hashed_auth,
          user_id: null,
          key: entry[0],
          value: entry[1],
        })
      );

      const customProperties =
        customPropertyRows.length > 0
          ? (
              await dbClient
                .from("properties")
                .insert(customPropertyRows)
                .select("*")
            ).data ?? []
          : [];

      return {
        data: { request: data, properties: customProperties },
        error: null,
      };
    }
  } catch (e) {
    return { data: null, error: JSON.stringify(e) };
  }
}

export async function hash(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashedKey = await crypto.subtle.digest(
    { name: "SHA-256" },
    encoder.encode(key)
  );
  const byteArray = Array.from(new Uint8Array(hashedKey));
  const hexCodes = byteArray.map((value) => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, "0");
    return paddedHexCode;
  });
  return hexCodes.join("");
}

function validateApiConfiguration(api_base: string | undefined): boolean {
  const openAiPattern = /^https:\/\/api\.openai\.com\/v\d+\/?$/;
  const azurePattern =
    /^https:\/\/([^.]*\.azure-api\.net|[^.]*\.openai\.azure\.com)\/?$/;
  const localProxyPattern = /^http:\/\/127\.0\.0\.1:\d+\/v\d+\/?$/;
  const heliconeProxyPattern = /^https:\/\/oai\.hconeai\.com\/v\d+\/?$/;

  return (
    api_base === undefined ||
    openAiPattern.test(api_base) ||
    azurePattern.test(api_base) ||
    localProxyPattern.test(api_base) ||
    heliconeProxyPattern.test(api_base)
  );
}

function getHeliconeHeaders(headers: Headers): HeliconeHeaders {
  const propTag = "helicone-property-";
  const properties = Object.fromEntries(
    [...headers.entries()]
      .filter(([key]) => key.startsWith(propTag) && key.length > propTag.length)
      .map(([key, value]) => [key.substring(propTag.length), value])
  );

  return {
    userId:
      headers.get("Helicone-User-Id")?.substring(0, 128) ??
      headers.get("User-Id")?.substring(0, 128) ??
      null,
    promptId: headers.get("Helicone-Prompt-Id")?.substring(0, 128) ?? null,
    properties: Object.keys(properties).length === 0 ? undefined : properties,
    isPromptRegexOn: headers.get("Helicone-Prompt-Format") !== null,
    promptName: headers.get("Helicone-Prompt-Name")?.substring(0, 128) ?? null,
  };
}

function removeHeliconeHeaders(request: Headers): Headers {
  const newHeaders = new Headers();
  for (const [key, value] of request.entries()) {
    if (!key.toLowerCase().startsWith("helicone-")) {
      newHeaders.set(key, value);
    }
  }
  return newHeaders;
}

async function ensureApiKeyAddedToAccount(
  useId: string,
  openAIApiKeyHash: string,
  preview: string,
  dbClient: SupabaseClient<Database>
) {
  await dbClient.from("user_api_keys").upsert(
    {
      user_id: useId,
      api_key_hash: openAIApiKeyHash,
      api_key_preview: preview,
      key_name: "automatically added",
    },
    {
      ignoreDuplicates: true,
      onConflict: "api_key_hash,user_id",
    }
  );
}

function formatTimeString(timeString: string): string {
  return new Date(timeString).toISOString().replace("Z", "");
}

async function logInClickhouse(
  request: Database["public"]["Tables"]["request"]["Row"],
  response: Database["public"]["Tables"]["response"]["Row"],
  properties: Database["public"]["Tables"]["properties"]["Row"][],
  env: ClickhouseEnv
) {
  return Promise.all([
    dbInsertClickhouse(env, "response_copy_v1", [
      {
        auth_hash: request.auth_hash,
        user_id: request.user_id,
        request_id: request.id,
        completion_tokens: response.completion_tokens,
        latency: response.delay_ms,
        model: ((response.body as any)?.model as string) || null,
        prompt_tokens: response.prompt_tokens,
        request_created_at: formatTimeString(request.created_at),
        response_created_at: formatTimeString(response.created_at),
        response_id: response.id,
        status: response.status,
      },
    ]),
    dbInsertClickhouse(env, "response_copy_v2", [
      {
        auth_hash: request.auth_hash,
        user_id: request.user_id,
        request_id: request.id,
        completion_tokens: response.completion_tokens,
        latency: response.delay_ms,
        model: ((response.body as any)?.model as string) || null,
        prompt_tokens: response.prompt_tokens,
        request_created_at: formatTimeString(request.created_at),
        response_created_at: formatTimeString(response.created_at),
        response_id: response.id,
        status: response.status,
        organization_id:
          request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
      },
    ]),
    dbInsertClickhouse(
      env,
      "properties_copy_v1",
      properties.map((p) => ({
        key: p.key,
        value: p.value,
        user_id: p.user_id,
        auth_hash: request.auth_hash,
        request_id: request.id,
        created_at: p.created_at ? formatTimeString(p.created_at) : null,
        id: p.id,
      }))
    ),
    dbInsertClickhouse(
      env,
      "properties_copy_v2",
      properties.map((p) => ({
        id: p.id,
        created_at: formatTimeString(p.created_at),
        request_id: request.id,
        key: p.key,
        value: p.value,
        organization_id:
          request.helicone_org_id ?? "00000000-0000-0000-0000-000000000000",
      }))
    ),
  ]);
}

async function forwardAndLog(
  requestSettings: RequestSettings,
  body: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  retryOptions?: RetryOptions,
  prompt?: Prompt | ChatPrompt
): Promise<Response> {
  const auth =
    request.headers.get("Authorization") ?? request.headers.get("api-key");
  if (auth === null) {
    return new Response("No authorization header found!", { status: 401 });
  }
  const startTime = new Date();

  const response = await (retryOptions
    ? forwardRequestToOpenAiWithRetry(
        request,
        requestSettings,
        retryOptions,
        body
      )
    : forwardRequestToOpenAi(request, requestSettings, body, retryOptions));
  const chunkEmitter = new EventEmitter();
  const responseBodySubscriber = once(chunkEmitter, "done");
  const decoder = new TextDecoder();
  let globalResponseBody = "";
  const loggingTransformStream = new TransformStream({
    transform(chunk, controller) {
      globalResponseBody += decoder.decode(chunk);
      controller.enqueue(chunk);
    },
    flush(controller) {
      chunkEmitter.emit("done", globalResponseBody);
    },
  });
  let readable = response.body?.pipeThrough(loggingTransformStream);

  if (requestSettings.ff_stream_force_format) {
    let buffer: any = null;
    const transformer = new TransformStream({
      transform(chunk, controller) {
        if (chunk.length < 50) {
          buffer = chunk;
        } else {
          if (buffer) {
            const mergedArray = new Uint8Array(buffer.length + chunk.length);
            mergedArray.set(buffer);
            mergedArray.set(chunk, buffer.length);
            controller.enqueue(mergedArray);
          } else {
            controller.enqueue(chunk);
          }
          buffer = null;
        }
      },
    });
    readable = readable?.pipeThrough(transformer);
  }

  const requestId =
    request.headers.get("Helicone-Request-Id") ?? crypto.randomUUID();
  console.log("request id", requestId);
  async function responseBodyTimeout(delay_ms: number) {
    await new Promise((resolve) => setTimeout(resolve, delay_ms));
    console.error("response body timeout");
    return globalResponseBody;
  }

  const headers = getHeliconeHeaders(request.headers);

  ctx.waitUntil(
    (async () => {
      const dbClient = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      );

      // THIS IS A TEMPORARY SHIM UNTIL WE BACKFILL AND MIGRATE EVERYONE TO USING HELICONE KEYS
      if (requestSettings.helicone_api_key) {
        const { data: heliconeUserId, error: userIdError } =
          await getHeliconeApiKeyRow(
            dbClient,
            requestSettings.helicone_api_key
          );
        if (userIdError !== null) {
          console.error(userIdError);
        } else {
          console.log("helicone user id", heliconeUserId);
          await ensureApiKeyAddedToAccount(
            heliconeUserId.user_id,
            await hash(auth),
            auth.replace("Bearer", "").trim().slice(0, 5) +
              "..." +
              auth.trim().slice(-3),
            dbClient
          );
        }
      }
      const requestBody = body === "" ? undefined : body;

      const requestResult = await logRequest({
        dbClient,
        request,
        auth,
        body: requestBody,
        prompt: prompt,
        ...headers,
        requestId,
        heliconeApiKey: requestSettings.helicone_api_key,
      });

      const responseStatus = response.status;
      const [wasTimeout, responseText] = await Promise.race([
        Promise.all([true, responseBodyTimeout(15 * 60 * 1000)]), //15 minutes
        Promise.all([false, responseBodySubscriber]),
      ]);

      if (requestResult.data !== null) {
        const responseResult = await readAndLogResponse({
          requestSettings,
          responseText,
          requestId: requestResult.data.request.id,
          dbClient,
          requestBody,
          responseStatus,
          startTime,
          wasTimeout,
        });

        if (responseResult.data !== null) {
          await logInClickhouse(
            requestResult.data.request,
            responseResult.data,
            requestResult.data.properties,
            env
          );
        }
      }
    })()
  );

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Helicone-Status", "success");
  responseHeaders.set("Helicone-Id", requestId);

  return new Response(readable, {
    ...response,
    headers: responseHeaders,
  });
}

async function uncachedRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  requestSettings: RequestSettings,
  retryOptions?: RetryOptions
): Promise<Response> {
  const result = await extractPrompt(request);
  if (result.data !== null) {
    const { request: formattedRequest, body: body, prompt } = result.data;
    return await forwardAndLog(
      requestSettings,
      body,
      formattedRequest,
      env,
      ctx,
      retryOptions,
      prompt
    );
  } else {
    return new Response(result.error, { status: 400 });
  }
}

async function buildCachedRequest(
  request: Request,
  idx: number
): Promise<Request> {
  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (key.toLowerCase().startsWith("helicone-")) {
      headers.set(key, value);
    }
    if (key.toLowerCase() === "authorization") {
      headers.set(key, value);
    }
  }

  const cacheKey = await hash(
    request.url +
      (await request.text()) +
      JSON.stringify([...headers.entries()]) +
      (idx >= 1 ? idx.toString() : "")
  );
  const cacheUrl = new URL(request.url);

  const pathName = cacheUrl.pathname.replaceAll("/", "_");
  cacheUrl.pathname = `/posts/${pathName}/${cacheKey}`;

  return new Request(cacheUrl, {
    method: "GET",
    headers: headers,
  });
}
async function saveToCache(
  request: Request,
  response: Response,
  cacheControl: string,
  settings: { maxSize: number }
): Promise<void> {
  console.log("Saving to cache");
  const cache = caches.default;
  const responseClone = response.clone();
  const responseHeaders = new Headers(responseClone.headers);
  responseHeaders.set("Cache-Control", cacheControl);
  const cacheResponse = new Response(responseClone.body, {
    ...responseClone,
    headers: responseHeaders,
  });
  console.log("cache response", response.headers);
  const { freeIndexes } = await getMaxCachedResponses(
    request.clone(),
    settings
  );
  if (freeIndexes.length > 0) {
    cache.put(await buildCachedRequest(request, freeIndexes[0]), cacheResponse);
  } else {
    throw new Error("No free indexes");
  }
}

async function getMaxCachedResponses(
  request: Request,
  { maxSize }: { maxSize: number }
): Promise<{ requests: Response[]; freeIndexes: number[] }> {
  const cache = caches.default;
  const requests = await Promise.all(
    Array.from(Array(maxSize).keys()).map(async (idx) => {
      const requestCache = await buildCachedRequest(request.clone(), idx);
      return cache.match(requestCache);
    })
  );
  return {
    requests: requests.filter((r) => r !== undefined) as Response[],
    freeIndexes: requests
      .map((r, idx) => idx)
      .filter((idx) => requests[idx] === undefined),
  };
}

async function getCachedResponse(
  request: Request,
  settings: { maxSize: number }
): Promise<Response | null> {
  const { requests: requestCaches, freeIndexes } = await getMaxCachedResponses(
    request.clone(),
    settings
  );
  if (freeIndexes.length > 0) {
    console.log("Max cache size reached, not caching");
    return null;
  } else {
    const cacheIdx = Math.floor(Math.random() * requestCaches.length);
    const randomCache = requestCaches[cacheIdx];
    const cachedResponseHeaders = new Headers(randomCache.headers);
    cachedResponseHeaders.append("Helicone-Cache", "HIT");
    cachedResponseHeaders.append(
      "Helicone-Cache-Bucket-Idx",
      cacheIdx.toString()
    );
    return new Response(randomCache.body, {
      ...randomCache,
      headers: cachedResponseHeaders,
    });
  }
}

async function recordCacheHit(headers: Headers, env: Env): Promise<void> {
  const requestId = headers.get("helicone-id");
  if (!requestId) {
    console.error("No request id found in cache hit");
    return;
  }
  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { error } = await dbClient
    .from("cache_hits")
    .insert({ request_id: requestId });
  if (error) {
    console.error(error);
  }
}

function generateRateLimitHeaders(
  rateLimitCheckResult: RateLimitResponse,
  rateLimitOptions: RateLimitOptions
): { [key: string]: string } {
  const policy = `${rateLimitOptions.quota};w=${rateLimitOptions.time_window};u=${rateLimitOptions.unit}`;
  const headers: { [key: string]: string } = {
    "Helicone-RateLimit-Limit": rateLimitCheckResult.limit.toString(),
    "Helicone-RateLimit-Remaining": rateLimitCheckResult.remaining.toString(),
    "Helicone-RateLimit-Policy": policy,
  };

  if (rateLimitCheckResult.reset !== undefined) {
    headers["Helicone-RateLimit-Reset"] = rateLimitCheckResult.reset.toString();
  }

  return headers;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      if (request.url.includes("audio")) {
        const url = new URL(request.url);
        const new_url = new URL(`https://api.openai.com${url.pathname}`);
        return await fetch(new_url.href, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
      }
      if (isLoggingEndpoint(request)) {
        const response = await handleLoggingEndpoint(request, env);
        return response;
      }
      if (isFeedbackEndpoint(request)) {
        const response = await handleFeedbackEndpoint(request, env);
        return response;
      }

      const rateLimitOptions = getRateLimitOptions(request);

      const requestBody =
        request.method === "POST"
          ? await request.clone().json<{ stream?: boolean; user?: string }>()
          : {};

      let additionalHeaders: { [key: string]: string } = {};
      if (rateLimitOptions !== undefined) {
        const auth = request.headers.get("Authorization");

        if (auth === null) {
          return new Response("No authorization header found!", {
            status: 401,
          });
        }

        const hashedKey = await hash(auth);
        const rateLimitCheckResult = await checkRateLimit(
          request,
          env,
          rateLimitOptions,
          hashedKey,
          requestBody.user
        );

        additionalHeaders = generateRateLimitHeaders(
          rateLimitCheckResult,
          rateLimitOptions
        );

        if (rateLimitCheckResult.status === "rate_limited") {
          return new Response(
            JSON.stringify({
              message:
                "Rate limit reached. Please wait before making more requests.",
            }),
            {
              status: 429,
              headers: {
                "content-type": "application/json;charset=UTF-8",
                ...additionalHeaders,
              },
            }
          );
        }
      }

      const api_base =
        request.headers.get("Helicone-OpenAI-Api-Base") ?? undefined;
      if (!validateApiConfiguration(api_base)) {
        return new Response(`Invalid API base "${api_base}"`, { status: 400 });
      }

      const requestSettings: RequestSettings = {
        stream: requestBody.stream ?? false,
        tokenizer_count_api: env.TOKENIZER_COUNT_API,
        helicone_api_key: request.headers.get("helicone-auth") ?? undefined,
        ff_stream_force_format:
          request.headers.get("helicone-ff-stream-force-format") === "true",
        ff_increase_timeout:
          request.headers.get("helicone-ff-increase-timeout") === "true",
        api_base,
      };

      const retryOptions = getRetryOptions(request);

      const { data: cacheSettings, error: cacheError } = getCacheSettings(
        request.headers,
        requestBody.stream ?? false
      );

      if (cacheError !== null) {
        return new Response(cacheError, { status: 400 });
      }

      if (cacheSettings.shouldReadFromCache) {
        const cachedResponse = await getCachedResponse(
          request.clone(),
          cacheSettings.bucketSettings
        );
        if (cachedResponse) {
          ctx.waitUntil(recordCacheHit(cachedResponse.headers, env));
          return cachedResponse;
        }
      }

      const requestClone = cacheSettings.shouldSaveToCache
        ? request.clone()
        : null;

      const response = await uncachedRequest(
        request,
        env,
        ctx,
        requestSettings,
        retryOptions
      );

      if (cacheSettings.shouldSaveToCache && requestClone) {
        ctx.waitUntil(
          saveToCache(
            requestClone,
            response,
            cacheSettings.cacheControl,
            cacheSettings.bucketSettings
          )
        );
      }
      const responseHeaders = new Headers(response.headers);
      if (cacheSettings.shouldReadFromCache) {
        responseHeaders.append("Helicone-Cache", "MISS");
      }
      Object.entries(additionalHeaders).forEach(([key, value]) => {
        responseHeaders.append(key, value);
      });

      if (rateLimitOptions !== undefined) {
        const auth = request.headers.get("Authorization");

        if (auth === null) {
          return new Response("No authorization header found!", {
            status: 401,
          });
        }
        const hashedKey = await hash(auth);
        updateRateLimitCounter(
          request,
          env,
          rateLimitOptions,
          hashedKey,
          requestBody.user
        );
      }

      return new Response(response.body, {
        ...response,
        status: response.status,
        headers: responseHeaders,
      });
    } catch (e) {
      console.error(e);
      return new Response(
        JSON.stringify({
          "helicone-message":
            "Helicone ran into an error servicing your request: " + e,
          support:
            "Please reach out on our discord or email us at help@helicone.ai, we'd love to help!",
          "helicone-error": JSON.stringify(e),
        }),
        {
          status: 500,
          headers: {
            "content-type": "application/json;charset=UTF-8",
            "helicone-error": "true",
          },
        }
      );
    }
  },
};
