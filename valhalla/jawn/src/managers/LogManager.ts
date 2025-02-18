import { RateLimitStore } from "../lib/stores/RateLimitStore";
import { RateLimitHandler } from "../lib/handlers/RateLimitHandler";
import { AuthenticationHandler } from "../lib/handlers/AuthenticationHandler";
import { RequestBodyHandler } from "../lib/handlers/RequestBodyHandler";
import { LoggingHandler } from "../lib/handlers/LoggingHandler";
import { ResponseBodyHandler } from "../lib/handlers/ResponseBodyHandler";
import {
  HandlerContext,
  KafkaMessageContents,
} from "../lib/handlers/HandlerContext";
import { LogStore } from "../lib/stores/LogStore";
import { PromptHandler } from "../lib/handlers/PromptHandler";
import { PostHogHandler } from "../lib/handlers/PostHogHandler";
import { S3Client } from "../lib/shared/db/s3Client";
import { S3ReaderHandler } from "../lib/handlers/S3ReaderHandler";
import * as Sentry from "@sentry/node";
import { VersionedRequestStore } from "../lib/stores/request/VersionedRequestStore";
import { KafkaProducer } from "../lib/clients/KafkaProducer";
import { WebhookHandler } from "../lib/handlers/WebhookHandler";
import { WebhookStore } from "../lib/stores/WebhookStore";
import { supabaseServer } from "../lib/db/supabase";
import { dataDogClient } from "../lib/clients/DataDogClient";
import { LytixHandler } from "../lib/handlers/LytixHandler";
import { SegmentLogHandler } from "../lib/handlers/SegmentLogHandler";
import { OnlineEvalHandler } from "../lib/handlers/OnlineEvalHandler";

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
    batchContext: {
      batchId: string;
      partition: number;
      lastOffset: string;
      messageCount: number;
    }
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

    const webhookHandler = new WebhookHandler(
      new WebhookStore(supabaseServer.client)
    );
    const segmentHandler = new SegmentLogHandler();

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
      .setNext(segmentHandler);

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
              batchId: batchContext.batchId,
              partition: batchContext.partition,
              offset: batchContext.lastOffset,
              messageCount: batchContext.messageCount,
            },
          });

          if (
            result.error ===
            "Authentication failed: Authentication failed: No API key found"
          ) {
            console.log(
              `Authentication failed: not reproducing for request ${logMessage.log.request.id} for batch ${batchContext.batchId}`
            );
            return;
          } else {
            console.error(
              `Reproducing error for request ${logMessage.log.request.id} for batch ${batchContext.batchId}: ${result.error}`
            );
          }
          const kafkaProducer = new KafkaProducer();
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
                batchId: batchContext.batchId,
                partition: batchContext.partition,
                offset: batchContext.lastOffset,
                messageCount: batchContext.messageCount,
              },
            });

            console.error(
              `Error sending message to DLQ: ${res.error} for request ${logMessage.log.request.id} in batch ${batchContext.batchId}`
            );
          }
        }
      })
    );

    await this.logRateLimits(rateLimitHandler, batchContext);
    await this.logHandlerResults(loggingHandler, batchContext, logMessages);

    await this.logPosthogEvents(posthogHandler, batchContext);
    await this.logLytixEvents(lytixHandler, batchContext);
    await this.logSegmentEvents(segmentHandler, batchContext);
    await this.logWebhooks(webhookHandler, batchContext);
    console.log(`Finished processing batch ${batchContext.batchId}`);
  }

  private async logHandlerResults(
    handler: LoggingHandler,
    batchContext: {
      batchId: string;
      partition: number;
      lastOffset: string;
      messageCount: number;
    },
    logMessages: KafkaMessageContents[]
  ): Promise<void> {
    console.log(`Upserting logs for batch ${batchContext.batchId}`);
    const start = performance.now();
    const result = await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: batchContext.messageCount,
      message: "Logs",
    });

    if (result.error) {
      Sentry.captureException(new Error(JSON.stringify(result.error)), {
        tags: {
          type: "UpsertError",
          topic: "request-response-logs-prod",
        },
        extra: {
          batchId: batchContext.batchId,
          partition: batchContext.partition,
          offset: batchContext.lastOffset,
          messageCount: batchContext.messageCount,
        },
      });

      console.error(
        `Error inserting logs: ${JSON.stringify(result.error)} for batch ${
          batchContext.batchId
        }`
      );

      const kafkaProducer = new KafkaProducer();
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
            batchId: batchContext.batchId,
            partition: batchContext.partition,
            offset: batchContext.lastOffset,
            messageCount: batchContext.messageCount,
          },
        });
      }
    }
  }

  private async logRateLimits(
    handler: RateLimitHandler,
    batchContext: {
      batchId: string;
      partition: number;
      lastOffset: string;
      messageCount: number;
    }
  ): Promise<void> {
    console.log(`Inserting rate limits for batch ${batchContext.batchId}`);
    const start = performance.now();
    const { data: rateLimitInsId, error: rateLimitErr } =
      await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: batchContext.messageCount,
      message: "Rate limits",
    });

    if (rateLimitErr || !rateLimitInsId) {
      Sentry.captureException(rateLimitErr, {
        tags: {
          type: "RateLimitError",
          topic: "request-response-logs-prod",
        },
        extra: {
          batchId: batchContext.batchId,
          partition: batchContext.partition,
          offset: batchContext.lastOffset,
          messageCount: batchContext.messageCount,
        },
      });

      console.error(
        `Error inserting rate limits: ${rateLimitErr} for batch ${batchContext.batchId}`
      );
    }
  }

  private async logLytixEvents(
    handler: LytixHandler,
    batchContext: {
      batchId: string;
      partition: number;
      lastOffset: string;
      messageCount: number;
    }
  ): Promise<void> {
    const start = performance.now();
    await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: batchContext.messageCount,
      message: "Lytix events",
    });
  }

  private async logSegmentEvents(
    handler: SegmentLogHandler,
    batchContext: {
      batchId: string;
      partition: number;
      lastOffset: string;
      messageCount: number;
    }
  ): Promise<void> {
    const start = performance.now();
    await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: batchContext.messageCount,
      message: "Segment events",
    });
  }

  private async logPosthogEvents(
    handler: PostHogHandler,
    batchContext: {
      batchId: string;
      partition: number;
      lastOffset: string;
      messageCount: number;
    }
  ): Promise<void> {
    const start = performance.now();
    await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: batchContext.messageCount,
      message: "Posthog events",
    });
  }

  private async logWebhooks(
    handler: WebhookHandler,
    batchContext: {
      batchId: string;
      partition: number;
      lastOffset: string;
      messageCount: number;
    }
  ): Promise<void> {
    const start = performance.now();
    await handler.handleResults();
    const end = performance.now();
    const executionTimeMs = end - start;

    dataDogClient.logHandleResults({
      executionTimeMs,
      handlerName: handler.constructor.name,
      methodName: "handleResults",
      messageCount: batchContext.messageCount,
      message: "Webhooks",
    });
  }
}
