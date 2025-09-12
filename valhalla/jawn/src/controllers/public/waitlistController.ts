import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Route,
  Tags,
} from "tsoa";
import { Result } from "../../packages/common/result";
import { WaitlistManager } from "../../managers/waitlist/WaitlistManager";

@Route("v1/public/waitlist")
@Tags("Waitlist")
export class WaitListController extends Controller {
  @Post("/feature")
  public async addToWaitlist(
    @Body()
    body: {
      email: string;
      feature: string;
    }
  ): Promise<Result<{ 
    success: boolean; 
    position?: number;
    alreadyOnList?: boolean;
    sharedPlatforms?: string[];
  }, string>> {
    const manager = new WaitlistManager();
    const result = await manager.addToWaitlist(body.email, body.feature);

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

    // Return 200 for both new additions and existing users
    this.setStatus(200);
    return result;
  }

  @Get("/feature/status")
  public async isOnWaitlist(
    @Query() email: string,
    @Query() feature: string
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
    @Query() feature: string
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

  @Post("/feature/share")
  public async trackShare(
    @Body()
    body: {
      email: string;
      feature: string;
      platform: "twitter" | "linkedin";
    }
  ): Promise<Result<{ 
    success: boolean; 
    newPosition?: number;
    message: string;
  }, string>> {
    const manager = new WaitlistManager();
    const result = await manager.trackShare(body.email, body.feature, body.platform);

    if (result.error) {
      if (result.error === "Already shared on this platform") {
        this.setStatus(409);
      } else if (result.error === "Not found on waitlist") {
        this.setStatus(404);
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
}