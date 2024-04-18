import { AbstractLogHandler } from "./AbstractLogHandler";
import { HandlerContext } from "./HandlerContext";

export class PropertiesHandler extends AbstractLogHandler {
  public handle(context: HandlerContext): Promise<void> {
    const request = context.message.log.request;

    const properties = Object.entries(request.properties).map((entry) => ({
      request_id: request.id,
      key: entry[0],
      value: entry[1],
      created_at: request.requestCreatedAt,
    }));

    context.addProperties(properties);

    return super.handle(context);
  }
}
