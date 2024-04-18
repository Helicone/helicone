import { RateLimitStore } from "../lib/stores/RateLimitStore";
import { RateLimitHandler } from "../lib/handlers/RateLimitHandler";
import { AuthenticationHandler } from "../lib/handlers/AuthenticationHandler";
import { HandlerContext, Message } from "../lib/handlers/HandlerContext";
import { RequestBodyHandler } from "../lib/handlers/RequestBodyHandler";
import { LoggingHandler } from "../lib/handlers/LoggingHandler";
import { PropertiesHandler } from "../lib/handlers/PropertiesHandler";
import { ResponseBodyHandler } from "../lib/handlers/ResponseBodyHandler";

class LogManager {
  public async processLogEntries(logMessages: Message[]): Promise<void> {
    const authHandler = new AuthenticationHandler();
    const rateLimitHandler = new RateLimitHandler(new RateLimitStore());
    const requestHandler = new RequestBodyHandler();
    const propertiesHandler = new PropertiesHandler();
    const responseBodyHandler = new ResponseBodyHandler();
    const loggingHandler = new LoggingHandler();

    authHandler
      .setNext(rateLimitHandler)
      .setNext(requestHandler)
      .setNext(propertiesHandler)
      .setNext(loggingHandler);

    for (const logMessage of logMessages) {
      const handlerContext = new HandlerContext(logMessage);
      await authHandler.handle(handlerContext);
    }

    const { data: rateLimitInsId, error: rateLimitErr } =
      await rateLimitHandler.handleResults();

    if (rateLimitErr || !rateLimitInsId) {
      console.log("Error inserting rate limits:", rateLimitErr);
    }
  }
}

/* TODO:
- Upsert request
- Map & Upsert properties
- Upsert response
*/
