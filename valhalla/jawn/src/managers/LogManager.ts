import * as Sentry from "@sentry/node";
import { dataDogClient } from "../lib/clients/DataDogClient";
import { HeliconeQueueProducer } from "../lib/clients/HeliconeQuequeProducer";
import { AuthenticationHandler } from "../lib/handlers/AuthenticationHandler";
import {
  HandlerContext,
  KafkaMessageContents,
} from "../lib/handlers/HandlerContext";
import { LoggingHandler } from "../lib/handlers/LoggingHandler";
import { LytixHandler } from "../lib/handlers/LytixHandler";
import { OnlineEvalHandler } from "../lib/handlers/OnlineEvalHandler";
import { PostHogHandler } from "../lib/handlers/PostHogHandler";
import { PromptHandler } from "../lib/handlers/PromptHandler";
import { RateLimitHandler } from "../lib/handlers/RateLimitHandler";
import { RequestBodyHandler } from "../lib/handlers/RequestBodyHandler";
import { ResponseBodyHandler } from "../lib/handlers/ResponseBodyHandler";
import { S3ReaderHandler } from "../lib/handlers/S3ReaderHandler";
import { SegmentLogHandler } from "../lib/handlers/SegmentLogHandler";
import { StripeLogHandler } from "../lib/handlers/StripeLogHandler";
import { WebhookHandler } from "../lib/handlers/WebhookHandler";
import { KAFKA_ENABLED } from "../lib/producers/KafkaProducerImpl";
import { S3Client } from "../lib/shared/db/s3Client";
import { LogStore } from "../lib/stores/LogStore";
import { RateLimitStore } from "../lib/stores/RateLimitStore";
import { VersionedRequestStore } from "../lib/stores/request/VersionedRequestStore";
import { WebhookStore } from "../lib/stores/WebhookStore";

export interface LogMetaData {
  batchId?: string;
  partition?: number;
  lastOffset?: string;
  messageCount?: number;
}

export class LogManager {
  public async processLogEntry(
    logMessage: KafkaMessageContents
  ): Promise<void> {
    await this.processLogEntries([logMessage], {
      batchId: "",
      partition: 0,
      lastOffset: "",
      messageCount: 1,
    });
  }

  public async processLogEntries(
    logMessages: KafkaMessageContents[],
    logMetaData: LogMetaData
  ): Promise<void> {
    const s3Client = new S3Client(
      process.env.S3_ACCESS_KEY ?? "",
      process.env.S3_SECRET_KEY ?? "",
      process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );

    const authHandler = new AuthenticationHandler();
    const rateLimitHandler = new RateLimitHandler(new RateLimitStore());
    const s3Reader = new S3ReaderHandler(s3Client);
    const requestHandler = new RequestBodyHandler();
    const responseBodyHandler = new ResponseBodyHandler();
    const promptHandler = new PromptHandler();
    const onlineEvalHandler = new OnlineEvalHandler();
    const loggingHandler = new LoggingHandler(
      new LogStore(),
      new VersionedRequestStore(""),
      s3Client
    );
    // Store in S3 after logging to DB
    const posthogHandler = new PostHogHandler();
    const lytixHandler = new LytixHandler();

    const webhookHandler = new WebhookHandler(new WebhookStore());
    const segmentHandler = new SegmentLogHandler();
    const stripeLogHandler = new StripeLogHandler();

    authHandler
      .setNext(rateLimitHandler)
      .setNext(s3Reader)
      .setNext(requestHandler)
      .setNext(responseBodyHandler)
      .setNext(promptHandler)
      .setNext(onlineEvalHandler)
      .setNext(loggingHandler)
      .setNext(posthogHandler)
      .setNext(lytixHandler)
      .setNext(webhookHandler)
      .setNext(segmentHandler)
      .setNext(stripeLogHandler);

    await Promise.all(
      logMessages.map(async (logMessage) => {
        const handlerContext = new HandlerContext(logMessage);
        const result = await authHandler.handle(handlerContext);

        if (result.error) {
          Sentry.captureException(new Error(result.error), {
            tags: {
              type: "HandlerError",
              topic: "request-response-logs-prod",
            },
            extra: {
              requestId: logMessage.log.request.id,
              responseId: logMessage.log.response.id,
              orgId: handlerContext.orgParams?.id ?? "",
              batchId: logMetaData.batchId,
              partition: logMetaData.partition,
              offset: logMetaData.lastOffset,
              messageCount: logMetaData.messageCount,
            },
          });

          if (
            result.error ===
            "Authentication failed: Authentication failed: No API key found"
          ) {
            console.log(
              `Authentication failed: not reproducing for request ${logMessage.log.request.id} for batch ${logMetaData.batchId}`
            );
            return;
          } else {
            console.error(
              `Reproducing error for request ${logMessage.log.request.id} for batch ${logMetaData.batchId}: ${result.error}`
            );
          }
          if (KAFKA_ENABLED) {
            const kafkaProducer = new HeliconeQueueProducer();

            const res = await kafkaProducer.sendMessages(
              [logMessage],
              "request-response-logs-prod-dlq"
            );

            if (res.error) {
              Sentry.captureException(new Error(res.error), {
                tags: {
                  type: "KafkaError",
                  topic: "request-response-logs-prod-dlq",
                },
                extra: {
                  requestId: logMessage.log.request.id,
                  responseId: logMessage.log.response.id,
                  orgId: handlerContext.orgParams?.id ?? "",
                  batchId: logMetaData.batchId,
                  partition: logMetaData.partition,
                  offset: logMetaData.lastOffset,
                  messageCount: logMetaData.messageCount,
                },
              });

              console.error(
                `Error sending message to DLQ: ${res.error} for request ${logMessage.log.request.id} in batch ${logMetaData.batchId}`
              );
            }
          }
        }
      })
    );

    await this.logRateLimits(rateLimitHandler, logMetaData);
    await this.logHandlerResults(loggingHandler, logMetaData, logMessages);
    await this.logStripeMeter(stripeLogHandler, logMetaData);

    // BEST EFFORT LOGGING
    this.logPosthogEvents(posthogHandler, logMetaData);
    this.logLytixEvents(lytixHandler, logMetaData);
    this.logSegmentEvents(segmentHandler, logMetaData);
    this.logWebhooks(webhookHandler, logMetaData);
    console.log(`Finished processing batch ${logMetaData.batchId}`);
  }

  private async logStripeMeter(
    stripeLogHandler: StripeLogHandler,
    logMetaData: LogMetaData
  ): Promise<void> {
    const start = performance.now();
    await stripeLogHandler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: stripeLogHandler.constructor.name,
      methodName: "handleResults",
      messageCount: logMetaData.messageCount ?? 0,
      message: "Stripe meter",
    });
  }

  private async logHandlerResults(
    handler: LoggingHandler,
    logMetaData: LogMetaData,
    logMessages: KafkaMessageContents[]
  ): Promise<void> {
    console.log(`Upserting logs for batch ${logMetaData.batchId}`);
    const start = performance.now();
    const result = await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: logMetaData.messageCount ?? 0,
      message: "Logs",
    });

    if (result.error) {
      Sentry.captureException(new Error(JSON.stringify(result.error)), {
        tags: {
          type: "UpsertError",
          topic: "request-response-logs-prod",
        },
        extra: {
          batchId: logMetaData.batchId,
          partition: logMetaData.partition,
          offset: logMetaData.lastOffset,
          messageCount: logMetaData.messageCount,
        },
      });

      console.error(
        `Error inserting logs: ${JSON.stringify(result.error)} for batch ${
          logMetaData.batchId
        }`
      );

      if (KAFKA_ENABLED) {
        const kafkaProducer = new HeliconeQueueProducer();
        const kafkaResult = await kafkaProducer.sendMessages(
          logMessages,
          "request-response-logs-prod-dlq"
        );

        if (kafkaResult.error) {
          Sentry.captureException(new Error(kafkaResult.error), {
            tags: {
              type: "KafkaError",
              topic: "request-response-logs-prod-dlq",
            },
            extra: {
              batchId: logMetaData.batchId,
              partition: logMetaData.partition,
              offset: logMetaData.lastOffset,
              messageCount: logMetaData.messageCount,
            },
          });
        }
      }
    }
  }

  private async logRateLimits(
    handler: RateLimitHandler,
    logMetaData: LogMetaData
  ): Promise<void> {
    console.log(`Inserting rate limits for batch ${logMetaData.batchId}`);
    const start = performance.now();
    const { data: rateLimitInsId, error: rateLimitErr } =
      await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: logMetaData.messageCount ?? 0,
      message: "Rate limits",
    });

    if (rateLimitErr || !rateLimitInsId) {
      Sentry.captureException(rateLimitErr, {
        tags: {
          type: "RateLimitError",
          topic: "request-response-logs-prod",
        },
        extra: {
          batchId: logMetaData.batchId,
          partition: logMetaData.partition,
          offset: logMetaData.lastOffset,
          messageCount: logMetaData.messageCount,
        },
      });

      console.error(
        `Error inserting rate limits: ${rateLimitErr} for batch ${logMetaData.batchId}`
      );
    }
  }

  private async logLytixEvents(
    handler: LytixHandler,
    logMetaData: LogMetaData
  ): Promise<void> {
    const start = performance.now();
    await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: logMetaData.messageCount ?? 0,
      message: "Lytix events",
    });
  }

  private async logSegmentEvents(
    handler: SegmentLogHandler,
    logMetaData: LogMetaData
  ): Promise<void> {
    const start = performance.now();
    await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: logMetaData.messageCount ?? 0,
      message: "Segment events",
    });
  }

  private async logPosthogEvents(
    handler: PostHogHandler,
    logMetaData: LogMetaData
  ): Promise<void> {
    const start = performance.now();
    await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: logMetaData.messageCount ?? 0,
      message: "Posthog events",
    });
  }

  private async logWebhooks(
    handler: WebhookHandler,
    logMetaData: LogMetaData
  ): Promise<void> {
    const start = performance.now();
    await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: logMetaData.messageCount ?? 0,
      message: "Webhooks",
    });
  }
}
