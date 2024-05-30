import { dataDogClient } from "../clients/DataDogClient";
import { PromiseGenericResult, ok } from "../shared/result";
import { HandlerContext } from "./HandlerContext";

interface LogHandler {
  setNext(handler: LogHandler): LogHandler;
  handle(entry: HandlerContext): PromiseGenericResult<string>;
}

export abstract class AbstractLogHandler implements LogHandler {
  private nextHandler: LogHandler | null = null;

  public setNext(handler: LogHandler): LogHandler {
    this.nextHandler = handler;
    return handler;
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();

    if (!this.nextHandler) {
      return ok("Chain complete.");
    }

    const result = await this.nextHandler.handle(context);

    const end = performance.now();
    const executionTimeMs = end - start;

    Promise.resolve(
      dataDogClient.logDistributionMetric(
        Date.now(),
        executionTimeMs,
        `${this.constructor.name}.handle`
      )
    ).catch();

    return result;
  }
}
