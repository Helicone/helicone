import { Controller, Route, Security, Tags, Request, Get, Path } from "tsoa";
import { Result, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";

@Route("v1/public/status/provider")
@Tags("Status")
@Security("api_key")
export class StatusController extends Controller {
  @Get("/{provider}")
  public async getProviderStatus(
    @Request() request: JawnAuthenticatedRequest,
    @Path() provider: string
  ): Promise<Result<string, string>> {
    return ok("ok");
  }
}
