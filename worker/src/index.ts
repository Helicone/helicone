import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getCacheSettings } from "./cache";
import { extractPrompt, Prompt } from "./prompt";
import { PassThrough } from "stream";
import { handleLoggingEndpoint, isLoggingEndpoint } from "./properties";

// import bcrypt from "bcrypt";

export interface Env {
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  TOKENIZER_COUNT_API: string;
}

interface SuccessResult<T> {
  data: T;
  error: null;
}
interface ErrorResult<T> {
  data: null;
  error: T;
}

interface RequestSettings {
  stream: boolean;
  tokenizer_count_api: string;
  ff_stream_force_format?: boolean;
  ff_increase_timeout?: boolean;
}

export type Result<T, K> = SuccessResult<T> | ErrorResult<K>;

function forwardRequestToOpenAi(
  request: Request,
  requestSettings: RequestSettings,
  body?: string
): Promise<Response> {
  let url = new URL(request.url);
  const new_url = new URL(`https://api.openai.com${url.pathname}`);
  const headers = removeHeliconeHeaders(request.headers);
  const method = request.method;
  const baseInit = { method, headers };
  const init = method === "GET" ? { ...baseInit } : { ...baseInit, body };
  if (requestSettings.ff_increase_timeout) {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => controller.abort(), 1000 * 60 * 30);
    return fetch(new_url.href, { ...init, signal });
  } else {
    return fetch(new_url.href, init);
  }
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

async function getTokenCount(
  inputText: string,
  tokenizer_count_api: string
): Promise<number> {
  console.log(inputText);
  const response = await fetch(tokenizer_count_api, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: inputText, model: "gpt2" }),
  });

  const data = await response.json<number>();
  return data;
}

async function getRequestCount(
  requestBody: any,
  tokenCount: (inputText: string) => Promise<number>
): Promise<number> {
  if (requestBody.prompt !== undefined) {
    const prompt = requestBody.prompt;
    if (typeof prompt === "string") {
      return tokenCount(requestBody.prompt);
    } else if ("length" in prompt) {
      return (
        await Promise.all(
          (prompt as string[]).map(async (p) => await tokenCount(p))
        )
      ).reduce((a, b) => a + b, 0);
    } else {
      throw new Error("Invalid prompt type");
    }
  } else if (requestBody.messages !== undefined) {
    const baseTokens = 3;
    const messages = requestBody.messages;
    return (
      baseTokens +
      (
        await Promise.all(
          (messages as { content: string }[]).map(
            async (m) => (await tokenCount(m.content)) + 5
          )
        )
      ).reduce((a, b) => a + b, 0)
    );
  } else {
    throw new Error(`Invalid request body:\n${JSON.stringify(requestBody)}`);
  }
}

function getResponseText(responseBody: any): string {
  type Choice =
    | {
        delta: {
          content: string;
        };
      }
    | {
        text: string;
      };
  if (responseBody.choices !== undefined) {
    const choices = responseBody.choices;
    return (choices as Choice[])
      .map((c) => {
        if ("delta" in c) {
          return c.delta.content;
        } else if ("text" in c) {
          return c.text;
        } else {
          throw new Error("Invalid choice type");
        }
      })
      .join("");
  } else {
    throw new Error(`Invalid response body:\n${JSON.stringify(responseBody)}`);
  }
}

function consolidateTextFields(responseBody: any[]): any {
  try {
    const consolidated = responseBody.reduce((acc, cur) => {
      if (!cur) {
        return acc;
      } else if (acc.choices === undefined) {
        return cur;
      } else {
        return {
          ...acc,
          choices: acc.choices.map((c: any, i: number) => {
            if (!cur.choices) {
              return c;
            } else if (
              c.delta !== undefined &&
              cur.choices[i]?.delta !== undefined
            ) {
              return {
                delta: {
                  ...c.delta,
                  content: c.delta.content
                    ? c.delta.content + cur.choices[i].delta.content
                    : cur.choices[i].delta.content,
                },
              };
            } else if (
              c.text !== undefined &&
              cur.choices[i]?.text !== undefined
            ) {
              return {
                ...c,
                text: c.text + cur.choices[i].text,
              };
            } else {
              return c;
            }
          }),
        };
      }
    }, {});

    consolidated.choices = consolidated.choices.map((c: any) => {
      if (c.delta !== undefined) {
        return {
          ...c,
          // delta: undefined,
          message: {
            ...c.delta,
            content: c.delta.content,
          },
        };
      } else {
        return c;
      }
    });
    return consolidated;
  } catch (e) {
    console.error("Error consolidating text fields", e);
    return responseBody[0];
  }
}

async function readResponse(
  requestSettings: RequestSettings,
  readable: ReadableStream<any>,
  requestBody: string
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
    } else {
      const lines = result.split("\n").filter((line) => line !== "");
      const data = lines.map((line, i) => {
        if (i === lines.length - 1) return {};
        return JSON.parse(line.replace("data:", ""));
      });

      const responseTokenCount = await getTokenCount(
        data
          .filter((d) => "id" in d)
          .map((d) => getResponseText(d))
          .join(""),
        requestSettings.tokenizer_count_api
      );
      const requestTokenCount = await getRequestCount(
        JSON.parse(requestBody),
        (inputText) =>
          getTokenCount(inputText, requestSettings.tokenizer_count_api)
      );

      console.log("requestTokenCount", requestTokenCount);
      console.log("responseTokenCount", responseTokenCount);

      try {
        return {
          data: {
            ...consolidateTextFields(data),
            streamed_data: data,
            usage: {
              prompt_tokens: requestTokenCount,
              completion_tokens: responseTokenCount,
              total_tokens: requestTokenCount + responseTokenCount,
            },
          },
          error: null,
        };
      } catch (e) {
        return {
          data: {
            ...consolidateTextFields(data),
            streamed_data: data,
            usage: {
              error: e,
            },
          },
          error: null,
        };
      }
    }
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
  dbClient: SupabaseClient,
  requestBody: any
): Promise<void> {
  const responseResult = await readResponse(
    requestSettings,
    readable,
    requestBody
  );
  if (responseResult.data !== null) {
    const { data, error } = await dbClient
      .from("response")
      .insert([{ request: requestId, body: responseResult.data }])
      .select("id");
    if (error !== null) {
      console.error(error);
    } else {
      console.log(data);
    }
  } else {
    console.error(responseResult.error);
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

  const response = await forwardRequestToOpenAi(request, requestSettings, body);
  let [readable, readableLog] = response.body?.tee() ?? [undefined, undefined];

  if (requestSettings.ff_stream_force_format) {
    let buffer: any = null;
    const transformer = new TransformStream({
      transform(chunk, controller) {
        console.log("buffer", buffer, chunk);
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

  ctx.waitUntil(
    (async () => {
      if (!readableLog) {
        return;
      }
      const dbClient = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
      );

      const requestBody = body === "" ? undefined : body;
      const requestResult = await logRequest({
        dbClient,
        request,
        auth,
        body: requestBody,
        prompt: prompt,
        ...getHeliconeHeaders(request.headers),
      });
      requestResult.data !== null
        ? readAndLogResponse(
            requestSettings,
            readableLog,
            requestResult.data,
            dbClient,
            requestBody
          )
        : Promise.resolve();
    })()
  );

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("Helicone-Status", "success");

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

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      if (isLoggingEndpoint(request)) {
        const response = await handleLoggingEndpoint(request, env);
        return response;
      }

      const requestBody =
        request.method === "POST"
          ? await request.clone().json<{ stream?: boolean }>()
          : {};
      const requestSettings: RequestSettings = {
        stream: requestBody.stream ?? false,
        tokenizer_count_api: env.TOKENIZER_COUNT_API,
        ff_stream_force_format:
          request.headers.get("helicone-ff-stream-force-format") === "true",
        ff_increase_timeout:
          request.headers.get("helicone-ff-increase-timeout") === "true",
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

      let requestClone = cacheSettings.shouldSaveToCache
        ? request.clone()
        : null;

      const response = await uncachedRequest(
        request,
        env,
        ctx,
        requestSettings
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

      return new Response(response.body, {
        ...response,
        headers: responseHeaders,
      });
    } catch (e) {
      console.error(e);
      return new Response(
        JSON.stringify({
          "helicone-message":
            "oh no :( this is embarrassing, Helicone ran into an error proxying your request. Please try again later",
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
