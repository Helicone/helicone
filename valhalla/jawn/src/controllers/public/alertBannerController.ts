import { Body, Controller, Get, Patch, Request, Route, Tags } from "tsoa";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";

@Route("v1/public/alert-banner")
@Tags("AdminAlertBanner")
export class AlertBannerController extends Controller {
  @Patch("/")
  public async updateAlertBannerActive(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      id: number;
      active: boolean;
    },
  ): Promise<Result<void, string>> {
    if (
      request.headers.authorization !== process.env.HELICONE_MANUAL_ACCESS_KEY
    ) {
      this.setStatus(401);
      return err("Unauthorized");
    }

    const { error } = await dbExecute(
      `
    UPDATE alert_banners SET active = $1 WHERE id = $2
    `,
      [body.active, body.id],
    );

    if (error) {
      this.setStatus(500);
      return err("Unable to update alert banner");
    }

    this.setStatus(200);
    return ok(undefined);
  }

  @Get("/")
  public async getAlertBanners(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<
    Result<
      {
        id: number;
        active: boolean;
        title: string;
        message: string;
        created_at: string;
        updated_at: string;
      }[],
      string
    >
  > {
    if (
      request.headers.authorization !== process.env.HELICONE_MANUAL_ACCESS_KEY
    ) {
      this.setStatus(401);
      return err("Unauthorized");
    }
    const { error, data } = await dbExecute(
      `SELECT * FROM alert_banners ORDER BY created_at ASC`,
      [],
    );

    if (error) {
      return err("Unable to get alert banners");
    }

    this.setStatus(200);
    return ok(
      data as {
        id: number;
        active: boolean;
        title: string;
        message: string;
        created_at: string;
        updated_at: string;
      }[],
    );
  }
}
