import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import { KVCache } from "../../lib/cache/kvCache";
import { err, ok, Result } from "../../lib/shared/result";
import { ModelComparisonManager } from "../../managers/ModelComparisonManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { cacheResultCustom } from "../../utils/cacheResult";
import { Model } from "openai/resources/models";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";

const kvCache = new KVCache(12 * 60 * 60 * 1000); // 12 hours

@Route("/v1/models")
@Tags("Models")
@Security("api_key")
export class ModelController extends Controller {
  @Get("/")
  public async getModels(@Request() request: JawnAuthenticatedRequest): Promise<
    Result<
      {
        model: string;
      }[],
      string
    >
  > {
    const result = await cacheResultCustom(
      "v1/public/compare/models" + JSON.stringify(request.authParams),
      async () => {
        const result = await dbQueryClickhouse<{
          model: string;
          count: number;
        }>(
          `
          SELECT 
          model,
          count() as count
          FROM request_response_rmt
          WHERE organization_id = {val_0: UUID}
          GROUP BY model
          ORDER BY count() DESC
          `,
          [request.authParams.organizationId]
        );
        return ok(result);
      },
      kvCache
    );

    if (result.error || !result.data) {
      this.setStatus(500);
      return err(
        JSON.stringify(result.error) || "Failed to fetch model comparison"
      );
    } else {
      this.setStatus(200);
      return ok(result.data.data?.map((r) => ({ model: r.model })) ?? []);
    }
  }
}
