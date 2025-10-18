import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import { KVCache } from "../../lib/cache/kvCache";
import { err, ok, Result } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { cacheResultCustom } from "../../utils/cacheResult";
import { dbQueryClickhouse } from "../../lib/shared/db/dbExecute";

const kvCache = new KVCache(12 * 60 * 60 * 1000); // 12 hours

export interface ProviderMetric {
  provider: string;
  total_requests: number;
}

@Route("/v1/providers")
@Tags("Providers")
@Security("api_key")
export class ProviderController extends Controller {
  @Get("/")
  public async getProviders(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<ProviderMetric[], string>> {
    const result = await cacheResultCustom(
      "v1/public/providers" + JSON.stringify(request.authParams),
      async () => {
        const result = await dbQueryClickhouse<ProviderMetric>(
          `
          SELECT
            provider,
            count(DISTINCT request_id) as total_requests
          FROM request_response_rmt
          WHERE organization_id = {val_0: UUID}
          GROUP BY provider
          ORDER BY total_requests DESC
          LIMIT 1000
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
        JSON.stringify(result.error) || "Failed to fetch providers"
      );
    } else {
      this.setStatus(200);
      return ok(result.data.data ?? []);
    }
  }
}
