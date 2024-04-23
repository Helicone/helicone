import { Database } from "../db/database.types";
import { PromiseGenericResult, err, ok } from "../modules/result";
import { ClickhouseDB, formatTimeString } from "../shared/db/dbExecute";
import { LogStore } from "../stores/LogStore";
import { RequestResponseStore } from "../stores/RequestResponseStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext, PromptRecord } from "./HandlerContext";

export type BatchPayload = {
  properties: Database["public"]["Tables"]["properties"]["Insert"][];
  responses: Database["public"]["Tables"]["response"]["Insert"][];
  requests: Database["public"]["Tables"]["request"]["Insert"][];
  prompts: PromptRecord[];
  requestResponseLogCH: ClickhouseDB["Tables"]["request_response_log"][];
  propertiesV3CH: ClickhouseDB["Tables"]["properties_v3"][];
  propertyWithResponseV1CH: ClickhouseDB["Tables"]["property_with_response_v1"][];
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
      properties: [],
      responses: [],
      requests: [],
      prompts: [],
      requestResponseLogCH: [],
      propertiesV3CH: [],
      propertyWithResponseV1CH: [],
    };
  }

  async handle(context: HandlerContext): Promise<void> {
    // Postgres
    context.payload.request = this.mapRequest(context);
    this.batchPayload.requests.push(context.payload.request);

    context.payload.response = this.mapResponse(context);
    this.batchPayload.responses.push(context.payload.response);

    context.addProperties(this.mapProperties(context));
    this.batchPayload.properties.push(...context.payload.properties);

    // Prompts
    if (context.message.log.request.promptId) {
      const prompt = this.mapPrompt(context);
      if (prompt) {
        context.payload.prompt = prompt;
        this.batchPayload.prompts.push(prompt);
      }
    }

    // Clickhouse
    context.payload.requestResponseLogCH = this.mapRequestResponseLog(context);
    this.batchPayload.requestResponseLogCH.push(
      context.payload.requestResponseLogCH
    );

    context.payload.propertiesV3CH = this.mapPropertiesV3(context);
    this.batchPayload.propertiesV3CH.push(...context.payload.propertiesV3CH);

    context.payload.propertyWithResponseV1CH =
      this.mapPropertiesWithResponse(context);
    this.batchPayload.propertyWithResponseV1CH.push(
      ...context.payload.propertyWithResponseV1CH
    );

    await super.handle(context);
  }

  public async handleResult(): PromiseGenericResult<string> {
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
      // Prepare all promises for concurrent execution
      const results = await Promise.all([
        this.requestResponseStore.insertRequestResponseLog(
          this.batchPayload.requestResponseLogCH
        ),
        this.requestResponseStore.insertPropertiesV3(
          this.batchPayload.propertiesV3CH
        ),
        this.requestResponseStore.insertPropertyWithResponseV1(
          this.batchPayload.propertyWithResponseV1CH
        ),
      ]);

      // Check results for any errors
      const errors = results
        .map((res, index) => {
          if (res.error) {
            const description =
              index === 0
                ? "request response logs"
                : index === 1
                ? "properties v3"
                : "property with response v1";
            return `Error inserting ${description}: ${res.error}`;
          }
          return null;
        })
        .filter((error) => error !== null);

      // Return the first error found or success message
      if (errors.length > 0) {
        console.error("Failed to log to Clickhouse:", errors.join(", "));
        return err(errors.join(", "));
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

  mapPrompt(context: HandlerContext): PromptRecord | null {
    if (
      !context.message.log.request.promptId ||
      !context.orgParams?.id ||
      !context.message.log.request.heliconeTemplate
    ) {
      return null;
    }

    const promptRecord: PromptRecord = {
      promptId: context.message.log.request.promptId,
      requestId: context.message.log.request.id,
      orgId: context.orgParams.id,
      model: context.message.log.model,
      heliconeTemplate: context.message.log.request.heliconeTemplate,
      createdAt: context.message.log.request.requestCreatedAt,
    };

    return promptRecord;
  }

  mapPropertiesV3(
    context: HandlerContext
  ): ClickhouseDB["Tables"]["properties_v3"][] {
    const request = context.message.log.request;
    const properties = context.payload.properties;
    const orgParams = context.orgParams;

    const propertiesV3 = properties.map((property) => ({
      id: property.id ?? 0,
      created_at: property.created_at
        ? formatTimeString(property.created_at)
        : formatTimeString(new Date().toISOString()),
      request_id: request.id,
      key: property.key,
      value: property.value,
      organization_id: orgParams?.id ?? "00000000-0000-0000-0000-000000000000",
    }));

    return propertiesV3;
  }

  mapPropertiesWithResponse(
    context: HandlerContext
  ): ClickhouseDB["Tables"]["property_with_response_v1"][] {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const properties = context.payload.properties;
    const orgParams = context.orgParams;
    const usage = context.usage;

    const propertyWithResponse = properties.map((property) => ({
      response_id: response.id ?? "",
      response_created_at: response.responseCreatedAt
        ? formatTimeString(response.responseCreatedAt.toISOString())
        : null,
      latency: response.delayMs ?? 0,
      status: response.status ?? 0,
      completion_tokens: usage.completionTokens ?? 0,
      prompt_tokens: usage.promptTokens ?? 0,
      model: context.message.log.model,
      request_id: request.id,
      request_created_at: formatTimeString(
        request.requestCreatedAt.toISOString()
      ),
      auth_hash: "",
      user_id: request.userId ?? "",
      organization_id: orgParams?.id ?? "00000000-0000-0000-0000-000000000000",
      time_to_first_token: response.timeToFirstToken ?? null,
      threat: request.threat ?? null,
      property_key: property.key,
      property_value: property.value,
      provider: request.provider ?? null,
      country_code: request.countryCode ?? null,
    }));

    return propertyWithResponse;
  }

  mapRequestResponseLog(
    context: HandlerContext
  ): ClickhouseDB["Tables"]["request_response_log"] {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const usage = context.usage;
    const orgParams = context.orgParams;

    const requestResponseLog: ClickhouseDB["Tables"]["request_response_log"] = {
      auth_hash: "", // TODO: Do we need this?
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
      organization_id: orgParams?.id ?? "00000000-0000-0000-0000-000000000000",
      job_id: null,
      node_id: null,
      proxy_key_id: request.heliconeProxyKeyId ?? null,
      threat: request.threat ?? null,
      time_to_first_token: response.timeToFirstToken ?? null,
      target_url: request.targetUrl ?? null,
      request_ip: null,
      provider: request.provider ?? null,
      country_code: request.countryCode ?? null,
    };

    return requestResponseLog;
  }

  mapProperties(
    context: HandlerContext
  ): Database["public"]["Tables"]["properties"]["Insert"][] {
    const request = context.message.log.request;

    const properties = Object.entries(request.properties).map((entry) => ({
      request_id: request.id,
      key: entry[0],
      value: entry[1],
      created_at: request.requestCreatedAt.toISOString(),
    }));

    return properties;
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
