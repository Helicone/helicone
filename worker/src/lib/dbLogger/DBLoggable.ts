import { SupabaseClient } from "@supabase/supabase-js";
import { HeliconeProxyRequest } from "../HeliconeProxyRequest/mapper";
import { ClickhouseClientWrapper } from "../db/clickhouse";
import { ChatPrompt, Prompt } from "../promptFormater/prompt";
import { logInClickhouse } from "./clickhouseLog";
import { initialResponseLog, logRequest } from "./logResponse";
import { Env } from "../..";
import { getTokenCount } from "./tokenCounter";
import { Result, mapPostgrestErr } from "../../results";
import { consolidateTextFields, getUsage } from "./responseParserHelpers";
import { Database } from "../../../supabase/database.types";

export interface DBLoggableProps {
  response: {
    getResponseBody: () => Promise<string>;
    status: number;
    responseHeaders: Headers;
    omitLog: boolean;
  };
  request: {
    requestId: string;
    userId?: string;
    heliconeApiKeyAuthHash?: string;
    providerApiKeyAuthHash?: string;
    promptId?: string;
    promptFormatter?: {
      prompt: Prompt | ChatPrompt;
      name: string;
    };
    startTime: Date;
    bodyText?: string;
    path: string;
    properties: Record<string, string>;
    isStream: boolean;
    omitLog: boolean;
    provider: Env["PROVIDER"];
  };
  tokenCalcUrl: string;
}

export function dbLoggableRequestFromProxyRequest(
  proxyRequest: HeliconeProxyRequest
): DBLoggableProps["request"] {
  return {
    requestId: proxyRequest.requestId,
    heliconeApiKeyAuthHash: proxyRequest.heliconeAuthHash,
    providerApiKeyAuthHash: proxyRequest.providerAuthHash,
    promptId: proxyRequest.requestWrapper.heliconeHeaders.promptId ?? undefined,
    userId: proxyRequest.userId,
    promptFormatter:
      proxyRequest.formattedPrompt?.prompt && proxyRequest.formattedPrompt?.name
        ? {
            prompt: proxyRequest.formattedPrompt.prompt,
            name: proxyRequest.formattedPrompt.name,
          }
        : undefined,
    startTime: proxyRequest.startTime,
    bodyText: proxyRequest.bodyText ?? undefined,
    path: proxyRequest.requestWrapper.url.href,
    properties: proxyRequest.requestWrapper.heliconeProperties,
    isStream: proxyRequest.isStream,
    omitLog: proxyRequest.omitOptions.omitRequest,
    provider: proxyRequest.provider,
  };
}

// Represents an object that can be logged to the database
export class DBLoggable {
  private response: DBLoggableProps["response"];
  private request: DBLoggableProps["request"];
  private provider: Env["PROVIDER"];
  private tokenCalcUrl: string;
  constructor(props: DBLoggableProps) {
    this.response = props.response;
    this.request = props.request;
    this.provider = props.request.provider;
    this.tokenCalcUrl = props.tokenCalcUrl;
  }

  async tokenCounter(text: string): Promise<number> {
    return getTokenCount(text, this.provider, this.tokenCalcUrl);
  }

  async parseResponse(responseBody: string): Promise<Result<any, string>> {
    const result = responseBody;
    const isStream = this.request.isStream;
    const responseStatus = this.response.status;
    const requestBody = this.request.bodyText;
    const tokenCounter = (t: string) => this.tokenCounter(t);
    if (isStream && this.provider === "ANTHROPIC") {
      return {
        error: null,
        data: {
          error: "Streaming not supported for anthropic yet",
          streamed_data: result,
        },
      };
    }

    try {
      if (
        this.provider === "ANTHROPIC" &&
        responseStatus === 200 &&
        requestBody
      ) {
        const responseJson = JSON.parse(result);
        const prompt = JSON.parse(requestBody)?.prompt ?? "";
        const completion = responseJson?.completion ?? "";
        const completionTokens = await tokenCounter(completion);
        const promptTokens = await tokenCounter(prompt);

        return {
          data: {
            ...responseJson,
            usage: {
              total_tokens: promptTokens + completionTokens,
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              helicone_calculated: true,
            },
          },
          error: null,
        };
      } else if (!isStream || responseStatus !== 200) {
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

        try {
          return {
            data: {
              ...consolidateTextFields(data),
              streamed_data: data,
              usage: await getUsage(data, requestBody, tokenCounter),
            },
            error: null,
          };
        } catch (e) {
          console.error("Error parsing response", e);
          return {
            data: {
              streamed_data: data,
            },
            error: null,
          };
        }
      }
    } catch (e) {
      console.log("Error parsing response", e);
      return {
        data: null,
        error: "error parsing response, " + e + ", " + result,
      };
    }
  }

  async readAndLogResponse(
    dbClient: SupabaseClient<Database>
  ): Promise<Result<Database["public"]["Tables"]["response"]["Row"], string>> {
    const responseBody = await this.response.getResponseBody();

    // Log delay
    const initialResponse = mapPostgrestErr(
      await initialResponseLog(this.request, dbClient)
    );

    if (initialResponse.error !== null) {
      return initialResponse;
    }

    const parsedResponse = await this.parseResponse(responseBody);

    if (parsedResponse.error === null) {
      return mapPostgrestErr(
        await dbClient
          .from("response")
          .update({
            request: this.request.requestId,
            body: this.response.omitLog
              ? {
                  usage: parsedResponse.data?.usage,
                }
              : parsedResponse.data,
            status: this.response.status,
            completion_tokens: parsedResponse.data.usage?.completion_tokens,
            prompt_tokens: parsedResponse.data.usage?.prompt_tokens,
          })
          .eq("id", initialResponse.data.id)
          .select("*")
          .single()
      );
    } else {
      return parsedResponse;
    }
  }

  async log(db: {
    supabase: SupabaseClient;
    clickhouse: ClickhouseClientWrapper;
  }) {
    const requestResult = await logRequest(this.request, db.supabase);

    if (requestResult.data !== null) {
      const responseResult = await this.readAndLogResponse(db.supabase);

      if (responseResult.data !== null) {
        await logInClickhouse(
          requestResult.data.request,
          responseResult.data,
          requestResult.data.properties,
          db.clickhouse
        );
      }
    }
  }
}
