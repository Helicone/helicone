import { dataDogClient } from "../clients/DataDogClient";
import { PromiseGenericResult, ok } from "../shared/result";
import { HandlerContext } from "./HandlerContext";

export interface LogHandler {
  setNext(handler: LogHandler): LogHandler;
  handle(entry: HandlerContext): PromiseGenericResult<string>;
  handleNext(entry: HandlerContext): PromiseGenericResult<string>;
  _handleWithoutTiming(entry: HandlerContext): PromiseGenericResult<string>;
}

export abstract class AbstractLogHandler implements LogHandler {
  private nextHandler: LogHandler | null = null;

  public setNext(handler: LogHandler): LogHandler {
    this.nextHandler = handler;
    return handler;
  }

  async _handleWithoutTiming(
    context: HandlerContext
  ): PromiseGenericResult<string> {
    throw new Error("Not implemented");
  }

  async handleNext(context: HandlerContext): PromiseGenericResult<string> {
    if (!this.nextHandler) {
      return ok("Chain complete.");
    }
    return await this.nextHandler.handle(context);
  }

  public async handle(context: HandlerContext): PromiseGenericResult<string> {
    const start = performance.now();

    if (!this.nextHandler) {
      return ok("Chain complete.");
    }

    const result = await this._handleWithoutTiming(context);
    if (result.error) {
      return result;
    }

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
