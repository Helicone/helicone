import * as traceloop from "@traceloop/node-server-sdk";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

import type OpenAI from "openai";
import type * as anthropic from "@anthropic-ai/sdk";
import type * as cohere from "cohere-ai";
import type * as bedrock from "@aws-sdk/client-bedrock-runtime";
import type * as google_aiplatform from "@google-cloud/aiplatform";
import type Together from "together-ai";
import type * as ChainsModule from "langchain/chains";
import type * as AgentsModule from "langchain/agents";
import type * as ToolsModule from "langchain/tools";

type IHeliconeAsyncLoggerOptions = {
  apiKey: string;
  baseUrl?: string;
  providers: {
    openAI?: typeof OpenAI;
    anthropic?: typeof anthropic;
    cohere?: typeof cohere;
    bedrock?: typeof bedrock;
    google_aiplatform?: typeof google_aiplatform;
    together?: typeof Together;
    langchain?: {
      chainsModule?: typeof ChainsModule;
      agentsModule?: typeof AgentsModule;
      toolsModule?: typeof ToolsModule;
    };
  };
  headers?: Record<string, string>;
};

export class HeliconeAsyncLogger {
  private apiKey: string;
  private baseUrl: string;
  private openAI?: typeof OpenAI;
  private anthropic?: typeof anthropic;
  private together?: typeof Together;
  private cohere?: typeof cohere;
  private bedrock?: typeof bedrock;
  private google_aiplatform?: typeof google_aiplatform;
  private chainsModule?: typeof ChainsModule;
  private agentsModule?: typeof AgentsModule;
  private toolsModule?: typeof ToolsModule;
  private headers?: Partial<Record<string, unknown>>;

  constructor(opts: IHeliconeAsyncLoggerOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl =
      opts.baseUrl ??
      (opts.apiKey.startsWith("sk-helicone-eu-")
        ? "https://eu.api.helicone.ai/v1/trace/log"
        : "https://api.helicone.ai/v1/trace/log");
    this.openAI = opts.providers?.openAI ?? undefined;
    this.anthropic = opts.providers?.anthropic ?? undefined;
    this.cohere = opts.providers?.cohere ?? undefined;
    this.bedrock = opts.providers?.bedrock ?? undefined;
    this.google_aiplatform = opts.providers?.google_aiplatform ?? undefined;
    this.together = opts.providers?.together ?? undefined;
    this.chainsModule = opts.providers?.langchain?.chainsModule ?? undefined;
    this.agentsModule = opts.providers?.langchain?.agentsModule ?? undefined;
    this.toolsModule = opts.providers?.langchain?.toolsModule ?? undefined;
    this.headers = opts.headers;
  }

  init() {
    traceloop.initialize({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      disableBatch: true,
      exporter: new OTLPTraceExporter({
        url: this.baseUrl,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...this.headers,
        },
      }),
      instrumentModules: {
        openAI: this.openAI ?? undefined,
        anthropic: this.anthropic ?? undefined,
        cohere: this.cohere ?? undefined,
        bedrock: this.bedrock ?? undefined,
        google_aiplatform: this.google_aiplatform ?? undefined,
        together: this.together ?? undefined,
        langchain: {
          chainsModule: this.chainsModule ?? undefined,
          agentsModule: this.agentsModule ?? undefined,
          toolsModule: this.toolsModule ?? undefined,
        },
      },
    });
  }

  withProperties(properties: Record<string, string>, fn: () => any) {
    return traceloop.withAssociationProperties(properties, fn);
  }
}
