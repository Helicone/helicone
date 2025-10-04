import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { WaitlistManager } from "../../managers/waitlist/WaitlistManager";

@Route("v1/waitlist")
@Tags("Waitlist")
@Security("api_key")
export class WaitListController extends Controller {
  @Post("/feature")
  public async addToWaitlist(
    @Body()
    body: {
      email: string;
      feature: string;
      organizationId?: string;
    },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<{ success: boolean; position?: number }, string>> {
    const manager = new WaitlistManager();
    const organizationId =
      body.organizationId || request.authParams.organizationId;

    const result = await manager.addToWaitlist(
      body.email,
      body.feature,
      organizationId,
    );

    if (result.error) {
      if (result.error === "already_on_waitlist") {
        this.setStatus(409);
      } else if (result.error.startsWith("Unsupported feature")) {
        this.setStatus(400);
      } else {
        this.setStatus(500);
      }
      return result;
    }

    this.setStatus(200);
    return result;
  }

  @Get("/feature/status")
  public async isOnWaitlist(
    @Query() email: string,
    @Query() feature: string,
    @Query() organizationId?: string,
    @Request() request?: JawnAuthenticatedRequest,
  ): Promise<Result<{ isOnWaitlist: boolean }, string>> {
    const manager = new WaitlistManager();
    const result = await manager.isOnWaitlist(email, feature);

    if (result.error) {
      if (result.error.startsWith("Unsupported feature")) {
        this.setStatus(400);
      } else {
        this.setStatus(500);
      }
      return result;
    }

    this.setStatus(200);
    return result;
  }

  @Get("/feature/count")
  public async getWaitlistCount(
    @Query() feature: string,
  ): Promise<Result<{ count: number }, string>> {
    const manager = new WaitlistManager();
    const result = await manager.getWaitlistCount(feature);

    if (result.error) {
      if (result.error.startsWith("Unsupported feature")) {
        this.setStatus(400);
      } else {
        this.setStatus(500);
      }
      return result;
    }

    this.setStatus(200);
    return result;
  }
}
