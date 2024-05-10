import { RateLimitStore } from "../lib/stores/RateLimitStore";
import { RateLimitHandler } from "../lib/handlers/RateLimitHandler";
import { AuthenticationHandler } from "../lib/handlers/AuthenticationHandler";
import { RequestBodyHandler } from "../lib/handlers/RequestBodyHandler";
import { LoggingHandler } from "../lib/handlers/LoggingHandler";
import { ResponseBodyHandler } from "../lib/handlers/ResponseBodyHandler";
import { HandlerContext, Message } from "../lib/handlers/HandlerContext";
import { LogStore } from "../lib/stores/LogStore";
import { ClickhouseClientWrapper } from "../lib/db/ClickhouseWrapper";
import { PromptHandler } from "../lib/handlers/PromptHandler";
import { PostHogHandler } from "../lib/handlers/PostHogHandler";
import { S3Client } from "../lib/shared/db/s3Client";
import { S3ReaderHandler } from "../lib/handlers/S3ReaderHandler";
import * as Sentry from "@sentry/node";
import { VersionedRequestStore } from "../lib/stores/request/VersionedRequestStore";
import { KafkaProducer } from "../lib/clients/KafkaProducer";

export class LogManager {
  public async processLogEntry(logMessage: Message): Promise<void> {
    await this.processLogEntries([logMessage], {
      batchId: "",
      partition: 0,
      lastOffset: "",
      messageCount: 1,
    });
  }

  public async processLogEntries(
    logMessages: Message[],
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
      process.env.S3_BUCKET_NAME ?? ""
    );

    const authHandler = new AuthenticationHandler();
    const rateLimitHandler = new RateLimitHandler(new RateLimitStore());
    const s3Reader = new S3ReaderHandler(s3Client);
    const requestHandler = new RequestBodyHandler();
    const responseBodyHandler = new ResponseBodyHandler();
    const promptHandler = new PromptHandler();
    const loggingHandler = new LoggingHandler(
      new LogStore(),
      new VersionedRequestStore(""),
      s3Client
    );
    // Store in S3 after logging to DB
    const posthogHandler = new PostHogHandler();

    authHandler
      .setNext(rateLimitHandler)
      .setNext(s3Reader)
      .setNext(requestHandler)
      .setNext(responseBodyHandler)
      .setNext(promptHandler)
      .setNext(loggingHandler)
      .setNext(posthogHandler);

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
          console.error(
            `Error processing request ${logMessage.log.request.id} for batch ${batchContext.batchId}: ${result.error}`
          );

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

    // Inserts everything in transaction
    console.log(`Upserting logs for batch ${batchContext.batchId}`);
    const upsertResult = await loggingHandler.handleResults();

    if (upsertResult.error) {
      Sentry.captureException(new Error(JSON.stringify(upsertResult.error)), {
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

      // Send to DLQ
      const kafkaProducer = new KafkaProducer();
      const result = await kafkaProducer.sendMessages(
        logMessages,
        "request-response-logs-prod-dlq"
      );

      if (result.error) {
        Sentry.captureException(new Error(result.error), {
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

      console.error(
        `Error inserting logs: ${JSON.stringify(
          upsertResult.error
        )} for batch ${batchContext.batchId}`
      );
    }

    // Insert rate limit entries after logs
    console.log(`Inserting rate limits for batch ${batchContext.batchId}`);
    const { data: rateLimitInsId, error: rateLimitErr } =
      await rateLimitHandler.handleResults();

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

    console.log(`Finished processing batch ${batchContext.batchId}`);
  }
}
