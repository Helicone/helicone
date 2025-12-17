import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import { err, ok, Result } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { WrappedManager, WrappedStats } from "../../managers/WrappedManager";

@Route("/v1/wrapped")
@Tags("Wrapped")
@Security("api_key")
export class WrappedController extends Controller {
  @Get("/2025")
  public async getWrapped2025Stats(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<WrappedStats, string>> {
    const manager = new WrappedManager(request.authParams);
    const result = await manager.getWrapped2025Stats();

    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    }

    this.setStatus(200);
    return ok(result.data!);
  }

  @Get("/2025/check")
  public async checkHasWrapped2025Data(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ hasData: boolean }, string>> {
    const manager = new WrappedManager(request.authParams);
    const result = await manager.checkHas2025Data();

    if (result.error) {
      this.setStatus(500);
      return err(result.error);
    }

    this.setStatus(200);
    return ok(result.data!);
  }
}
