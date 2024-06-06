import { ClickhouseDB, formatTimeString } from "../db/ClickhouseWrapper";
import { Database } from "../db/database.types";
import { S3Client } from "../shared/db/s3Client";
import { PromiseGenericResult, Result, err, ok } from "../shared/result";
import { LogStore } from "../stores/LogStore";
import { VersionedRequestStore } from "../stores/request/VersionedRequestStore";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext, PromptRecord } from "./HandlerContext";

type S3Record = {
  requestId: string;
  organizationId: string;
  requestBody: string;
  responseBody: string;
  assets: Map<string, string>;
};

type SearchRecord = {
  requestId: string;
  organizationId: string;
  requestBody: string;
  responseBody: string;
  model: string;
};

export type BatchPayload = {
  responses: Database["public"]["Tables"]["response"]["Insert"][];
  requests: Database["public"]["Tables"]["request"]["Insert"][];
  prompts: PromptRecord[];
  assets: Database["public"]["Tables"]["asset"]["Insert"][];
  s3Records: S3Record[];
  requestResponseVersionedCH: ClickhouseDB["Tables"]["request_response_versioned"][];
  searchRecords: Database["public"]["Tables"]["request_response_search"]["Insert"][];
};

export class LoggingHandler extends AbstractLogHandler {
  private batchPayload: BatchPayload;
  private logStore: LogStore;
  private requestStore: VersionedRequestStore;
  private s3Client: S3Client;

  constructor(
    logStore: LogStore,
    requestStore: VersionedRequestStore,
    s3Client: S3Client
  ) {
    super();
    this.logStore = logStore;
    this.requestStore = requestStore;
    this.s3Client = s3Client;
    this.batchPayload = {
      responses: [],
      requests: [],
      prompts: [],
      assets: [],
      s3Records: [],
      requestResponseVersionedCH: [],
      searchRecords: [],
    };
  }

  async handle(context: HandlerContext): PromiseGenericResult<string> {
    // Perform all mappings first and check for failures before updating the batch payload
    try {
      const requestMapped = this.mapRequest(context);
      const responseMapped = this.mapResponse(context);
      const assetsMapped = this.mapAssets(context);
      const s3RecordMapped = this.mapS3Records(context);
      const searchRecordsMapped = this.mapSearchRecords(context);
      const promptMapped =
        context.message.log.request.promptId &&
        context.processedLog.request.heliconeTemplate
          ? this.mapPrompt(context)
          : null;
      const requestResponseVersionedCHMapped =
        this.mapRequestResponseVersionedCH(context);

      this.batchPayload.requests.push(requestMapped);
      this.batchPayload.responses.push(responseMapped);
      this.batchPayload.assets.push(...assetsMapped);
      this.batchPayload.searchRecords.push(...searchRecordsMapped);

      if (s3RecordMapped) {
        this.batchPayload.s3Records.push(s3RecordMapped);
      }

      if (promptMapped) {
        this.batchPayload.prompts.push(promptMapped);
      }

      this.batchPayload.requestResponseVersionedCH.push(
        requestResponseVersionedCHMapped
      );

      return await super.handle(context);
    } catch (error: any) {
      return err(
        `Failed to map data: ${error.message}, Context: ${this.constructor.name}`
      );
    }
  }

  public async handleResults(): Promise<
    Result<
      string,
      {
        pgError?: string;
        s3Error?: string;
        chError?: string;
      }
    >
  > {
    const pgResult = await this.logStore.insertLogBatch(this.batchPayload);

    if (pgResult.error) {
      return err({
        pgError: `Error inserting logs to Postgres: ${pgResult.error}`,
      });
    }

    const s3Result = await this.uploadToS3();

    if (s3Result.error) {
      return err({
        s3Error: `Error inserting logs to S3: ${s3Result.error}`,
      });
    }

    const chResult = await this.logToClickhouse();

    if (chResult.error) {
      return err({
        chError: `Error inserting logs to Clickhouse: ${chResult.error}`,
      });
    }

    return ok("Successfully inserted logs");
  }

  async uploadToS3(): PromiseGenericResult<string> {
    const uploadPromises = this.batchPayload.s3Records.map(async (s3Record) => {
      const key = this.s3Client.getRequestResponseKey(
        s3Record.requestId,
        s3Record.organizationId
      );

      // Upload request and response body
      const uploadRes = await this.s3Client.store(
        key,
        JSON.stringify({
          request: s3Record.requestBody,
          response: s3Record.responseBody,
        })
      );

      if (uploadRes.error) {
        return err(
          `Failed to store request body for request ID ${s3Record.requestId}: ${uploadRes.error}`
        );
      }

      // Optionally upload assets if they exist
      if (s3Record.assets && s3Record.assets.size > 0) {
        const imageUploadRes = await this.storeRequestResponseImage(
          s3Record.organizationId,
          s3Record.requestId,
          s3Record.assets
        );

        if (imageUploadRes.error) {
          return err(
            `Failed to store request response images: ${imageUploadRes.error}`
          );
        }
      }

      return ok(`S3 upload successful for request ID ${s3Record.requestId}`);
    });

    await Promise.all(uploadPromises);

    // TODO: How to handle errors here?

    return ok("All S3 uploads successful");
  }

  private async storeRequestResponseImage(
    organizationId: string,
    requestId: string,
    assets: Map<string, string>
  ): PromiseGenericResult<string> {
    const uploadPromises: Promise<void>[] = Array.from(assets.entries()).map(
      ([assetId, imageUrl]) =>
        this.handleImageUpload(assetId, imageUrl, requestId, organizationId)
    );

    await Promise.allSettled(uploadPromises);

    return ok("Images uploaded successfully");
  }

  private async handleImageUpload(
    assetId: string,
    imageUrl: string,
    requestId: string,
    organizationId: string
  ): Promise<void> {
    try {
      if (imageUrl.startsWith("data:image/")) {
        const [assetType, base64Data] = this.extractBase64Data(imageUrl);
        const buffer = Buffer.from(base64Data, "base64");
        await this.s3Client.uploadBase64ToS3(
          buffer,
          assetType,
          requestId,
          organizationId,
          assetId
        );
      } else {
        const response = await fetch(imageUrl, {
          headers: {
            "User-Agent": "Helicone-Worker (https://helicone.ai)",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        const blob = await response.blob();
        await this.s3Client.uploadImageToS3(
          blob,
          requestId,
          organizationId,
          assetId
        );
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      // If we fail to upload an image, we don't want to fail logging the request
    }
  }

  private extractBase64Data(dataUri: string): [string, string] {
    const matches = dataUri.match(
      /^data:(image\/(?:png|jpeg|jpg|gif|webp));base64,(.*)$/
    );
    if (!matches || matches.length !== 3) {
      console.error("Invalid base64 image data");
      return ["", ""];
    }
    return [matches[1], matches[2]];
  }

  async logToClickhouse(): PromiseGenericResult<string> {
    try {
      const result = await this.requestStore.insertRequestResponseVersioned(
        this.batchPayload.requestResponseVersionedCH
      );

      if (result.error) {
        return err(`Error inserting request response logs: ${result.error}`);
      }

      return ok("All logs inserted successfully.");
    } catch (error: any) {
      return err(
        `Unexpected error during logging to Clickhouse: ${
          error.message ?? "No error message provided"
        }`
      );
    }
  }

  mapS3Records(context: HandlerContext): S3Record | null {
    const request = context.message.log.request;
    const orgParams = context.orgParams;
    const assets = context.processedLog.assets;

    if (!orgParams?.id) {
      return null;
    }

    const s3Record: S3Record = {
      requestId: request.id,
      organizationId: orgParams.id,
      requestBody: context.processedLog.request.body,
      responseBody: context.processedLog.response.body,
      assets: assets ?? new Map(),
    };

    return s3Record;
  }

  mapSearchRecords(
    context: HandlerContext
  ): Database["public"]["Tables"]["request_response_search"]["Insert"][] {
    const request = context.message.log.request;
    const orgParams = context.orgParams;

    if (
      !orgParams?.id ||
      !this.vectorizeModel(context.processedLog.model ?? "")
    ) {
      return [];
    }

    const searchRecord: Database["public"]["Tables"]["request_response_search"]["Insert"] =
      {
        request_id: request.id,
        organization_id: orgParams.id,
        request_body_vector: this.extractRequestBodyMessage(
          context.processedLog.request.body
        ),
        response_body_vector: this.extractResponseBodyMessage(
          context.processedLog.response.body
        ),
      };

    return [searchRecord];
  }

  mapAssets(
    context: HandlerContext
  ): Database["public"]["Tables"]["asset"]["Insert"][] {
    const request = context.message.log.request;
    const orgParams = context.orgParams;
    const assets = context.processedLog.assets;

    if (!orgParams?.id || !assets || assets.size === 0) {
      return [];
    }

    const assetInserts: Database["public"]["Tables"]["asset"]["Insert"][] =
      Array.from(assets.entries()).map(([assetId]) => ({
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
      model: context.processedLog.model,
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
        model: context.processedLog.model ?? "",
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
        properties: context.processedLog.request.properties ?? {},
        scores: {},
        sign: 1,
        version: 1,
      };

    return requestResponseLog;
  }

  mapResponse(
    context: HandlerContext
  ): Database["public"]["Tables"]["response"]["Insert"] {
    const response = context.message.log.response;
    const processedResponse = context.processedLog.response;
    const orgParams = context.orgParams;

    const responseInsert: Database["public"]["Tables"]["response"]["Insert"] = {
      id: response.id,
      request: context.message.log.request.id,
      helicone_org_id: orgParams?.id ?? null,
      body: "{}",
      status: response.status,
      model: processedResponse.model,
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
    const processedRequest = context.processedLog.request;

    const requestInsert: Database["public"]["Tables"]["request"]["Insert"] = {
      id: request.id,
      path: request.path,
      body: "{}",
      auth_hash: "",
      user_id: request.userId ?? null,
      prompt_id: request.promptId ?? null,
      properties: processedRequest.properties ?? {},
      helicone_user: authParams?.userId ?? null,
      helicone_api_key_id: authParams?.heliconeApiKeyId ?? null,
      helicone_org_id: orgParams?.id ?? null,
      provider: request.provider,
      helicone_proxy_key_id: request.heliconeProxyKeyId ?? null,
      model: processedRequest.model,
      model_override: heliconeMeta.modelOverride ?? null,
      threat: request.threat ?? null,
      target_url: request.targetUrl,
      country_code: request?.countryCode ?? null,
      created_at: request.requestCreatedAt.toISOString(),
    };

    return requestInsert;
  }

  private extractRequestBodyMessage(requestBody: any): string {
    try {
      const messagesArray = requestBody?.messages;

      if (!Array.isArray(messagesArray)) {
        return "";
      }

      const allMessages = messagesArray
        .filter((message) => {
          return message?.role === "user";
        })
        .map((message) => {
          if (typeof message === "object" && message !== null) {
            const content = message["content"];
            if (Array.isArray(content)) {
              return content
                .map((part) => {
                  if (part.type === "text") {
                    return part.text;
                  }
                  return "";
                })
                .join(" ");
            } else if (typeof content === "string") {
              return content;
            }
          }
          return "";
        })
        .join(" ");

      return this.ensureMaxVectorLength(allMessages.trim());
    } catch (error) {
      console.error("Error pulling request body messages:", error);
      return "";
    }
  }

  private extractResponseBodyMessage(responseBody: any): string {
    try {
      const choicesArray = responseBody?.choices;

      if (!Array.isArray(choicesArray)) {
        return "";
      }

      const allMessages = choicesArray
        .map((choice) => {
          return choice?.message?.content || "";
        })
        .join(" ");

      return this.ensureMaxVectorLength(allMessages.trim());
    } catch (error) {
      console.error("Error pulling response body messages:", error);
      return "";
    }
  }

  private ensureMaxVectorLength = (text: string): string => {
    const maxBytes = 848000; // ~300k less than 1MB for buffer
    text = text.replace(/[^\x00-\x7F]/g, "");
    text = text.trim();

    let buffer = Buffer.from(text, "utf-8");

    if (buffer.length <= maxBytes) {
      return text;
    }

    let truncatedBuffer = Buffer.alloc(maxBytes);
    buffer.copy(truncatedBuffer, 0, 0, maxBytes);

    let endIndex = maxBytes;
    while (endIndex > 0 && truncatedBuffer[endIndex - 1] >> 6 === 2) {
      endIndex--;
    }

    const truncatedText = truncatedBuffer.toString("utf-8", 0, endIndex);

    return truncatedText;
  };

  private vectorizeModel = (model: string): boolean => {
    if (!model) {
      return false;
    }
    const nonVectorizedModels: Set<string> = new Set(["dall-e-2", "dall-e-3"]);
    return !nonVectorizedModels.has(model);
  };
}
