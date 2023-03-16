import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getCacheSettings } from "./cache";
import { extractPrompt, Prompt } from "./prompt";
import { PassThrough } from "stream";
// import bcrypt from "bcrypt";

export interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
}

interface SuccessResult<T> {
  data: T;
  error: null;
}
interface ErrorResult<T> {
  data: null;
  error: T;
}

export type Result<T, K> = SuccessResult<T> | ErrorResult<K>;

function forwardRequestToOpenAi(
  request: Request,
  body?: string
): Promise<Response> {
  let url = new URL(request.url);
  const new_url = new URL(`https://api.openai.com${url.pathname}`);
  const headers = removeHeliconeHeaders(request.headers);
  const method = request.method;
  const baseInit = { method, headers };
  const init = method === "GET" ? { ...baseInit } : { ...baseInit, body };
  return fetch(new_url.href, init);
}

type HeliconeRequest = {
  dbClient: SupabaseClient;
  request: Request;
  auth: string;
  body?: string;
  prompt?: Prompt;
} & HeliconeHeaders;

interface HeliconeHeaders {
  requestId: string;
  userId: string | null;
  promptId: string | null;
  properties?: Record<string, string>;
  isPromptRegexOn: boolean;
  promptName: string | null;
}

async function getPromptId(
  dbClient: SupabaseClient,
  prompt: Prompt,
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
      const { data: highestSuffixData, error: highestSuffixError } =
        await dbClient
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
  isPromptRegexOn,
  promptName,
}: HeliconeRequest): Promise<Result<string, string>> {
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

    const { data, error } = await dbClient
      .from("request")
      .insert([
        {
          id: requestId,
          path: request.url,
          body: json,
          auth_hash: await hash(auth),
          user_id: jsonUserId ?? userId,
          prompt_id: promptId,
          properties: properties,
          formatted_prompt_id: formattedPromptId,
          prompt_values: prompt_values,
        },
      ])
      .select("id")
      .single();

    if (error !== null) {
      return { data: null, error: error.message };
    } else {
      return { data: data.id, error: null };
    }
  } catch (e) {
    return { data: null, error: JSON.stringify(e) };
  }
}

function heliconeHeaders(
  requestResult: Result<string, string>
): Record<string, string> {
  if (requestResult.error !== null) {
    console.error(requestResult.error);
    return {
      "Helicone-Error": requestResult.error,
      "Helicone-Status": "error",
    };
  } else {
    return { "Helicone-Status": "success", "Helicone-Id": requestResult.data };
  }
}
async function hash(key: string): Promise<string> {
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

function getHeliconeHeaders(headers: Headers): HeliconeHeaders {
  const propTag = "helicone-property-";
  const properties = Object.fromEntries(
    [...headers.entries()]
      .filter(
        ([key, _]) => key.startsWith(propTag) && key.length > propTag.length
      )
      .map(([key, value]) => [key.substring(propTag.length), value])
  );
  return {
    userId:
      headers.get("Helicone-User-Id")?.substring(0, 128) ??
      headers.get("User-Id")?.substring(0, 128) ??
      null,
    promptId: headers.get("Helicone-Prompt-Id")?.substring(0, 128) ?? null,
    requestId:
      headers.get("Helicone-Request-Id")?.substring(0, 128) ??
      crypto.randomUUID(),
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

async function readResponse(
  requestSettings: RequestSettings,
  readable: ReadableStream<any>
): Promise<Result<any, string>> {
  const reader = await readable?.getReader();
  let result = "";
  const MAX_LOOPS = 10_000;
  let i = 0;
  while (true) {
    if (reader === undefined) break;
    const res = await reader?.read();
    if (res?.done) break;
    if (typeof res?.value === "string") {
      result += res?.value;
    } else if (res?.value instanceof Uint8Array) {
      result += new TextDecoder().decode(res?.value);
    }
    i++;
    if (i > MAX_LOOPS) break;
  }
  try {
    if (!requestSettings.stream) {
      return {
        data: JSON.parse(result),
        error: null,
      };
    }
    const lines = result.split("\n").filter((line) => line !== "");
    const data = lines.map((line, i) => {
      if (i === lines.length - 1) return {};

      return JSON.parse(line.replace("data:", ""));
    });
    return {
      data: data,
      error: null,
    };
  } catch (e) {
    return {
      data: null,
      error: "error parsing response, " + e + ", " + result,
    };
  }
}

async function readAndLogResponse(
  requestSettings: RequestSettings,
  readable: ReadableStream<any>,
  requestId: string,
  dbClient: SupabaseClient
): Promise<void> {
  const responseResult = await readResponse(requestSettings, readable);
  const { data, error } = await dbClient
    .from("response")
    .insert([{ request: requestId, body: responseResult }])
    .select("id");
  if (error !== null) {
    console.error(error);
  } else {
    console.log(data);
  }
}

async function forwardAndLog(
  requestSettings: RequestSettings,
  body: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  prompt?: Prompt
): Promise<Response> {
  const auth = request.headers.get("Authorization");
  if (auth === null) {
    return new Response("No authorization header found!", { status: 401 });
  }

  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const [response, requestResult] = await Promise.all([
    forwardRequestToOpenAi(request, body),
    logRequest({
      dbClient,
      request,
      auth,
      body: body === "" ? undefined : body,
      prompt: prompt,
      ...getHeliconeHeaders(request.headers),
    }),
  ]);
  const [readable, readableLog] = response.body?.tee() ?? [
    undefined,
    undefined,
  ];

  ctx.waitUntil(
    readableLog && requestResult.data !== null
      ? readAndLogResponse(
          requestSettings,
          readableLog,
          requestResult.data,
          dbClient
        )
      : Promise.resolve()
  );

  const responseHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(heliconeHeaders(requestResult))) {
    responseHeaders.set(key, value);
  }
  return new Response(readable, {
    ...response,
    headers: responseHeaders,
  });
}

async function uncachedRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  requestSettings: RequestSettings
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
  console.log("PATHNAME", cacheUrl.pathname);

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
  responseHeaders.append("Cache-Control", cacheControl);
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

interface RequestSettings {
  stream: boolean;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const requestBody = await request.clone().json<{ stream?: boolean }>();
    const requestSettings = {
      stream: requestBody.stream ?? false,
    };

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

    let requestClone = cacheSettings.shouldSaveToCache ? request.clone() : null;

    const response = await uncachedRequest(request, env, ctx, requestSettings);

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

    return new Response(response.body, {
      ...response,
      headers: responseHeaders,
    });
  },
};
