// import { $JAWN_API } from "@/lib/clients/jawn";
import { Provider } from "@helicone-package/cost/unified/types";
import { Message, Tool } from "@helicone-package/llm-mapper/types";
import { z } from "zod";
import { env } from "next-runtime-env";
import { getHeliconeCookie } from "@/lib/cookies";
import { ORG_ID_COOKIE_KEY } from "@/lib/constants";
import Cookies from "js-cookie";
import { OpenAI } from "openai";
import { logger } from "@/lib/telemetry/logger";

export interface ModelParameters {
  temperature: number | null | undefined;
  max_tokens: number | null | undefined;
  top_p: number | null | undefined;
  frequency_penalty: number | null | undefined;
  presence_penalty: number | null | undefined;
  stop: string | null | undefined;
  reasoning_effort?: "low" | "medium" | "high" | "minimal" | null | undefined;
  verbosity?: "low" | "medium" | "high" | null | undefined;
}

export interface GenerateParams {
  provider: Provider;
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[] | string;
  tools?: Tool[];
  schema?: object extends object ? z.ZodType<object> : never;
  signal?: AbortSignal;
  includeReasoning?: boolean;
  reasoning_effort?: "low" | "medium" | "high" | "minimal";
  verbosity?: "low" | "medium" | "high";
  response_format?: { type: "json_schema"; json_schema?: object };
  stream?: {
    onChunk: (chunk: string) => void;
    onCompletion: () => void;
  };
  useAIGateway?: boolean;
  endpoint?: "playground" | "agent";
}

export type GenerateResponse = {
  content: string;
  reasoning: string;
  calls: string;
};

async function handleStreamResponse(
  response: Response,
  onChunk: (_chunk: string) => void,
  onCompletion: () => void,
): Promise<GenerateResponse> {
  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buffer.trim()) {
          const events = buffer.split("\n\n");
          for (const event of events) {
            if (event.startsWith("data: ")) {
              const jsonString = event.substring(6).trim();
              if (jsonString) {
                try {
                  const data = JSON.parse(jsonString);
                  if (data.error) {
                    throw new Error(data.error);
                  }
                  onChunk(jsonString);
                } catch (e) {
                  if (e instanceof Error) throw e;
                  onChunk(jsonString);
                }
              }
            }
          }
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        if (event.startsWith("data: ")) {
          const jsonString = event.substring(6).trim();
          if (jsonString) {
            try {
              const data = JSON.parse(jsonString);
              if (data.error) {
                throw new Error(data.error);
              }
              onChunk(jsonString);
            } catch (e) {
              if (e instanceof Error) throw e;
              onChunk(jsonString);
            }
          }
        }
      }
    }
    return { content: "", reasoning: "", calls: "" };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { content: "", reasoning: "", calls: "" };
    }
    throw error;
  } finally {
    onCompletion();
  }
}

async function handleNonStreamResponse(
  response: Response,
  schema?: z.ZodType<object>,
): Promise<GenerateResponse> {
  const data = await response.json();

  if (
    schema &&
    typeof data === "object" &&
    data !== null &&
    "content" in data
  ) {
    try {
      const parsedSchema = schema.parse(JSON.parse(data.content));
      return {
        content: JSON.stringify(parsedSchema),
        reasoning: (data as any).reasoning || "",
        calls: "",
      };
    } catch (error) {
      logger.error({ error }, "[generate] Failed to parse schema response");
    }
  }

  return {
    content: typeof data === "string" ? data : (data as any)?.content || "",
    reasoning: (data as any)?.reasoning || "",
    calls: (data as any)?.calls || "",
  };
}

export async function generate<T extends object | undefined = undefined>(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParams & {
    stream?: {
      onChunk: (chunk: string) => void;
      onCompletion: () => void;
    };
    schema?: z.ZodType<object>;
    useAIGateway?: boolean;
    logRequest?: boolean;
    endpoint?: "playground" | "agent";
  },
): Promise<GenerateResponse> {
  const currentOrgId = Cookies.get(ORG_ID_COOKIE_KEY);
  const jwtToken = getHeliconeCookie().data?.jwtToken ?? "";

  const apiEndpoint = params.endpoint === "agent" ? "agent" : "playground";

  const response = await fetch(
    `${env("NEXT_PUBLIC_HELICONE_JAWN_SERVICE")}/v1/${apiEndpoint}/generate`,
    {
      method: "POST",
      body: JSON.stringify({
        messages: params.messages,
        stream: !!params.stream,
        max_tokens: params.max_tokens,
        temperature: params.temperature,
        top_p: params.top_p,
        frequency_penalty: params.frequency_penalty,
        presence_penalty: params.presence_penalty,
        stop: params.stop,
        tools: params.tools,
        response_format: params.response_format,
        model: params.model,
        reasoning_effort: params.reasoning_effort,
        verbosity: params.verbosity,
        useAIGateway: params.useAIGateway,
        logRequest: params.logRequest,
      }),
      headers: {
        "helicone-authorization": JSON.stringify({
          _type: "jwt",
          token: jwtToken,
          orgId: currentOrgId ?? "no-org-id",
        }),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate response");
  }

  if (params.stream) {
    return handleStreamResponse(
      response,
      params.stream.onChunk,
      params.stream.onCompletion,
    );
  }

  return handleNonStreamResponse(response, params.schema);
}
