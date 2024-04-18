import { PromiseGenericResult, ok } from "../modules/result";
import { ClaudeBodyParser, IBodyParser } from "../shared/bodyParsers/claudeBodyParser";
import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class ResponseBodyHandler extends AbstractLogHandler {
  public handle(context: HandlerContext): Promise<void> {
    const responseBody = this.mapResponseBody(context);
  }

  private mapResponseBody(context: HandlerContext): any {
    const request = context.message.log.request;
    const response = context.message.log.response;
    const isStream = request.isStream;

    let responseBody: any;
    try {
        if(!isStream && request.provider === "ANTHROPIC" && request.body) {
            responseBody = JSON.parse(request.body);
        }
    }
  }

  async parseBody(isStream: boolean, provider: string, body: any): PromiseGenericResult<any> {
    try {
        const parser = this.getParser(isStream, provider, body);
        return parser.parse(body);
      } catch (error: any) {
        return err(`Error parsing body: ${error}, ${body}`);
      }

  }

   getParser(isStream: boolean, provider: string, body: any): IBodyParser {
    if(!isStream && provider === "ANTHROPIC" && body) {
        return new ClaudeBodyParser()
    } else {
        throw new Error("No parser found");
    }
}

}