import type { components } from "../types/public.js";

type RequestQueryParams = components["schemas"]["RequestQueryParams"];
type SessionQueryParams = components["schemas"]["SessionQueryParams"];
type HeliconeRequest = components["schemas"]["HeliconeRequest"];
type SessionResult = components["schemas"]["SessionResult"];

const HELICONE_API_BASE = "https://api.helicone.ai";
const HELICONE_AI_GATEWAY_BASE = "https://ai-gateway.helicone.ai";
const REQUEST_BODY_CACHE = new Map<string, { request?: any; response?: any }>();
const CACHE_MAX_SIZE = 10000;

interface FetchRequestsOptions {
  filter?: components["schemas"]["RequestFilterNode"];
  offset?: number;
  limit?: number;
  sort?: components["schemas"]["SortLeafRequest"];
  includeBodies?: boolean;
}

interface FetchSessionsOptions {
  search?: string;
  timeFilter: {
    startTimeUnixMs: number;
    endTimeUnixMs: number;
  };
  nameEquals?: string;
  timezoneDifference: number;
  filter?: components["schemas"]["SessionFilterNode"];
  offset?: number;
  limit?: number;
}

interface RequestWithBodies extends Omit<HeliconeRequest, 'request_body' | 'response_body'> {
  request_body?: unknown;
  response_body?: unknown;
}

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  [key: string]: any;
}

interface AIGatewayOptions {
  sessionId?: string;
  sessionName?: string;
  userId?: string;
  customProperties?: Record<string, any>;
}

// idrk how caching really works with MCP servers here
// if you're reading this check if MCP servers run constantly in the background or
// if they cold-start on each MCP invocation.
async function fetchSignedContent(
  signedUrl: string,
  requestId: string
): Promise<any | null> {
  try {
    const cached = REQUEST_BODY_CACHE.get(requestId);
    if (cached) {
      return cached;
    }

    const response = await fetch(signedUrl);
    if (!response.ok) {
      console.error(
        `Failed to fetch signed content for ${requestId}: ${response.status}`
      );
      return null;
    }

    const text = await response.text();
    const content = JSON.parse(text);

    REQUEST_BODY_CACHE.set(requestId, content);
    if (REQUEST_BODY_CACHE.size > CACHE_MAX_SIZE) {
      REQUEST_BODY_CACHE.clear();
    }

    return content;
  } catch (error) {
    console.error(`Error fetching signed content for ${requestId}:`, error);
    return null;
  }
}

async function enrichRequestWithBodies(
  request: HeliconeRequest
): Promise<RequestWithBodies> {
  if (!request.signed_body_url) {
    return request;
  }

  const content = await fetchSignedContent(request.signed_body_url, request.request_id);
  if (!content) {
    return request;
  }

  return {
    ...request,
    request_body: content.request,
    response_body: content.response,
  };
}


export async function fetchRequests(
  apiKey: string,
  options: FetchRequestsOptions
): Promise<RequestWithBodies[]> {
  const requestBody: RequestQueryParams = {
    filter: options.filter || {},
    offset: options.offset,
    limit: options.limit,
    sort: options.sort,
  } as RequestQueryParams;

  try {
    const response = await fetch(
      `${HELICONE_API_BASE}/v1/request/query-clickhouse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const result = (await response.json()) as {
      data: HeliconeRequest[];
      error: null | string;
    };

    if (!result.data) {
      return [];
    }

    if (!options.includeBodies) {
      return result.data;
    }

    const requestsWithBodies = await Promise.all(
      result.data.map((request) => enrichRequestWithBodies(request))
    );

    return requestsWithBodies;
  } catch (error) {
    throw new Error(
      `Error querying Helicone requests: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function fetchSessions(
  apiKey: string,
  options: FetchSessionsOptions
): Promise<SessionResult[]> {
  const requestBody: SessionQueryParams = {
    search: options.search || "",
    timeFilter: options.timeFilter,
    nameEquals: options.nameEquals,
    timezoneDifference: options.timezoneDifference,
    filter: options.filter || {},
    offset: options.offset,
    limit: options.limit,
  };

  try {
    const response = await fetch(`${HELICONE_API_BASE}/v1/session/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API request failed with status ${response.status}: ${errorText}`
      );
    }

    const result = (await response.json()) as {
      data: SessionResult[];
      error: null | string;
    };

    return result.data || [];
  } catch (error) {
    throw new Error(
      `Error querying Helicone sessions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function useAiGateway(
  apiKey: string,
  request: ChatCompletionRequest,
  options?: AIGatewayOptions
): Promise<any> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    // Add Helicone headers for observability
    if (options?.sessionId) {
      headers["Helicone-Session-Id"] = options.sessionId;
    }
    if (options?.sessionName) {
      headers["Helicone-Session-Name"] = options.sessionName;
    }
    if (options?.userId) {
      headers["Helicone-User-Id"] = options.userId;
    }
    if (options?.customProperties) {
      Object.entries(options.customProperties).forEach(([key, value]) => {
        headers[`Helicone-Property-${key}`] = String(value);
      });
    }

    const response = await fetch(`${HELICONE_AI_GATEWAY_BASE}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Gateway request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(
      `Error using AI Gateway: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

