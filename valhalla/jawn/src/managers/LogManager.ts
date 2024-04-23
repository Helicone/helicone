import { RateLimitStore } from "../lib/stores/RateLimitStore";
import { RateLimitHandler } from "../lib/handlers/RateLimitHandler";
import { AuthenticationHandler } from "../lib/handlers/AuthenticationHandler";
import { RequestBodyHandler } from "../lib/handlers/RequestBodyHandler";
import { LoggingHandler } from "../lib/handlers/LoggingHandler";
import { ResponseBodyHandler } from "../lib/handlers/ResponseBodyHandler";
import { HandlerContext, Message } from "../lib/handlers/HandlerContext";
import { LogStore } from "../lib/stores/LogStore";
import { RequestResponseStore } from "../lib/stores/RequestResponseStore";

class LogManager {
  public async processLogEntries(
    logMessages: Message[],
    batchId: string
  ): Promise<void> {
    const authHandler = new AuthenticationHandler();
    const rateLimitHandler = new RateLimitHandler(new RateLimitStore());
    const requestHandler = new RequestBodyHandler();
    const responseBodyHandler = new ResponseBodyHandler();
    const loggingHandler = new LoggingHandler(
      new LogStore(),
      new RequestResponseStore()
    );

    authHandler
      .setNext(rateLimitHandler)
      .setNext(requestHandler)
      .setNext(responseBodyHandler)
      .setNext(loggingHandler);

    await Promise.all(
      logMessages.map(async (logMessage) => {
        const handlerContext = new HandlerContext(logMessage);
        await authHandler.handle(handlerContext);
      })
    );

    // Inserts everything in transaction
    const upsertResult = await loggingHandler.handleResults();

    if (upsertResult.error) {
      console.error(
        `Error inserting logs: ${upsertResult.error} for batch ${batchId}`
      );
    }

    // Insert rate limit entries after logs
    const { data: rateLimitInsId, error: rateLimitErr } =
      await rateLimitHandler.handleResults();

    if (rateLimitErr || !rateLimitInsId) {
      console.error(
        `Error inserting rate limits: ${rateLimitErr} for batch ${batchId}`
      );
    }
  }
}
