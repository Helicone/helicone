import { dataDogClient } from "../clients/DataDogClient";
import { PromiseGenericResult, ok } from "../../packages/common/result";
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
    if (!this.nextHandler) {
      return ok("Chain complete.");
    }
    const result = await this.nextHandler.handle(context);

    return result;
  }
}
