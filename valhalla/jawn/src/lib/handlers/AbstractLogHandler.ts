import { PromiseGenericResult, err } from "../modules/result";
import { HandlerContext } from "./HandlerContext";

interface LogHandler {
  setNext(handler: LogHandler): LogHandler;
  handle(entry: HandlerContext): Promise<void>;
  handleResults<T>(): PromiseGenericResult<T>;
}

export abstract class AbstractLogHandler implements LogHandler {
  private nextHandler: LogHandler | null = null;

  public setNext(handler: LogHandler): LogHandler {
    this.nextHandler = handler;
    return handler;
  }

  public async handle(context: HandlerContext): Promise<void> {
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }
  }

  public async handleResults<T>(): PromiseGenericResult<T> {
    return err("Not implemented");
  }
}
