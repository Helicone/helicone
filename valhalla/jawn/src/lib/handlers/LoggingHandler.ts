import { ClickhouseDB, formatTimeString } from "../db/ClickhouseWrapper";
import { Database } from "../db/database.types";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { LogStore } from "../stores/LogStore";
import { RequestResponseStore } from "../stores/RequestResponseStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext, PromptRecord } from "./HandlerContext";

export type BatchPayload = {
  responses: Database["public"]["Tables"]["response"]["Insert"][];
  requests: Database["public"]["Tables"]["request"]["Insert"][];
  prompts: PromptRecord[];
  assets: Database["public"]["Tables"]["asset"]["Insert"][];
  requestResponseVersionedCH: ClickhouseDB["Tables"]["request_response_versioned"][];
};

export class LoggingHandler extends AbstractLogHandler {
  private batchPayload: BatchPayload;
  private logStore: LogStore;
  private requestResponseStore: RequestResponseStore;

  constructor(logStore: LogStore, requestResponseStore: RequestResponseStore) {
    super();
    this.logStore = logStore;
    this.requestResponseStore = requestResponseStore;
    this.batchPayload = {
      responses: [],
      requests: [],
      prompts: [],
      assets: [],
      requestResponseVersionedCH: [],
    };
  }

  async handle(context: HandlerContext): PromiseGenericResult<string> {
    console.log(`LoggingHandler: ${context.message.log.request.id}`);
    // Postgres
    this.batchPayload.requests.push(this.mapRequest(context));
    this.batchPayload.responses.push(this.mapResponse(context));
    this.batchPayload.assets.push(...this.mapAssets(context));

    // Prompts
    if (
      context.message.log.request.promptId &&
      context.processedLog.request.heliconeTemplate
    ) {
      const prompt = this.mapPrompt(context);
      if (prompt) {
        this.batchPayload.prompts.push(prompt);
      }
    }

    // Clickhouse
    this.batchPayload.requestResponseVersionedCH.push(
      this.mapRequestResponseVersionedCH(context)
    );

    return await super.handle(context);
  }

  public async handleResults(): PromiseGenericResult<string> {
    const pgResult = await this.logStore.insertLogBatch(this.batchPayload);

    if (pgResult.error) {
      return err(`Error inserting logs: ${pgResult.error}`);
    }

    const chResult = await this.logToClickhouse();

    if (chResult.error) {
      return err(`Error inserting logs to Clickhouse: ${chResult.error}`);
    }

    return ok("Successfully inserted logs");
  }

  async logToClickhouse(): PromiseGenericResult<string> {
    try {
      const result =
        await this.requestResponseStore.insertRequestResponseVersioned(
          this.batchPayload.requestResponseVersionedCH
        );

      if (result.error) {
        console.error("Failed to log to Clickhouse:", result.error);
        return err(`Error inserting request response logs: ${result.error}`);
      }

      return ok("All logs inserted successfully.");
    } catch (error: any) {
      console.error("Failed to log to Clickhouse:", error);
      return err(
        `Unexpected error during logging: ${
          error.message ?? "No error message provided"
        }`
      );
    }
  }

  mapAssets(
    context: HandlerContext
  ): Database["public"]["Tables"]["asset"]["Insert"][] {
    const request = context.message.log.request;
    const orgParams = context.orgParams;
    const assets = context.message.log.assets;

    if (!orgParams?.id || !assets || Object.values(assets).length === 0) {
      return [];
    }

    const assetInserts: Database["public"]["Tables"]["asset"]["Insert"][] =
      Object.keys(assets).map(([assetId]) => ({
        id: assetId,
        request_id: request.id,
        organization_id: orgParams.id,
        created_at: request.requestCreatedAt.toISOString(),
      }));

    return assetInserts;
  }

  mapPrompt(context: HandlerContext): PromptRecord | null {
    if (
      !context.message.log.request.promptId ||
      !context.orgParams?.id ||
      !context.processedLog.request.heliconeTemplate
    ) {
      return null;
    }

    const promptRecord: PromptRecord = {
      promptId: context.message.log.request.promptId,
      requestId: context.message.log.request.id,
      orgId: context.orgParams.id,
      model: context.message.log.model,
      heliconeTemplate: context.processedLog.request.heliconeTemplate,
      createdAt: context.message.log.request.requestCreatedAt,
    };

    return promptRecord;
  }

  mapRequestResponseVersionedCH(
    context: HandlerContext
  ): ClickhouseDB["Tables"]["request_response_versioned"] {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const usage = context.usage;
    const orgParams = context.orgParams;

    const requestResponseLog: ClickhouseDB["Tables"]["request_response_versioned"] =
      {
        user_id: request.userId,
        request_id: request.id,
        completion_tokens: usage.completionTokens ?? null,
        latency: response.delayMs ?? null,
        model: context.message.log.model,
        prompt_tokens: usage.promptTokens ?? null,
        request_created_at: formatTimeString(
          request.requestCreatedAt.toISOString()
        ),
        response_created_at: response.responseCreatedAt
          ? formatTimeString(response.responseCreatedAt.toISOString())
          : null,
        response_id: response.id ?? null,
        status: response.status ?? null,
        organization_id:
          orgParams?.id ?? "00000000-0000-0000-0000-000000000000",
        proxy_key_id: request.heliconeProxyKeyId ?? null,
        threat: request.threat ?? null,
        time_to_first_token: response.timeToFirstToken ?? null,
        target_url: request.targetUrl ?? null,
        provider: request.provider ?? null,
        country_code: request.countryCode ?? null,
        properties: request.properties,
        sign: 1,
        version: 1,
      };

    return requestResponseLog;
  }

  mapResponse(
    context: HandlerContext
  ): Database["public"]["Tables"]["response"]["Insert"] {
    const response = context.message.log.response;
    const processedBody = context.processedLog.response.body;

    const responseInsert: Database["public"]["Tables"]["response"]["Insert"] = {
      id: response.id,
      request: context.message.log.request.id,
      body: processedBody,
      status: response.status,
      model: response.model,
      completion_tokens: context.usage.completionTokens,
      prompt_tokens: context.usage.promptTokens,
      time_to_first_token: response.timeToFirstToken,
      delay_ms: response.delayMs,
      created_at: response.responseCreatedAt.toISOString(),
    };

    return responseInsert;
  }

  mapRequest(
    context: HandlerContext
  ): Database["public"]["Tables"]["request"]["Insert"] {
    const request = context.message.log.request;
    const orgParams = context.orgParams;
    const authParams = context.authParams;
    const heliconeMeta = context.message.heliconeMeta;
    const processedBody = context.processedLog.request.body;

    const requestInsert: Database["public"]["Tables"]["request"]["Insert"] = {
      id: request.id,
      path: request.path,
      body: processedBody,
      auth_hash: "",
      user_id: request.userId ?? null,
      prompt_id: request.promptId ?? null,
      properties: request.properties,
      helicone_user: authParams?.userId ?? null,
      helicone_api_key_id: authParams?.heliconeApiKeyId ?? null,
      helicone_org_id: orgParams?.id ?? null,
      provider: request.provider,
      helicone_proxy_key_id: request.heliconeProxyKeyId ?? null,
      model: request.model,
      model_override: heliconeMeta.modelOverride ?? null,
      threat: request.threat ?? null,
      target_url: request.targetUrl,
      country_code: request?.countryCode ?? null,
      created_at: request.requestCreatedAt.toISOString(),
    };

    return requestInsert;
  }
}
