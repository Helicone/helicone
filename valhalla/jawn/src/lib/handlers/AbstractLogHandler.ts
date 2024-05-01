import { PromiseGenericResult, err, ok } from "../shared/result";
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
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }

    return ok("Chain complete.");
  }
}
