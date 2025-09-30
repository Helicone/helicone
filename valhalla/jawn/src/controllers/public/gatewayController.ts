import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { err, ok, Result } from "../../packages/common/result";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";

export interface GatewayEligibilityResponse {
  shouldShowBanner: boolean;
  reason?: string;
  monthlyRequests?: number;
  monthlyInferenceCost?: number;
  monthlyHeliconeeCost?: number;
  potentialSavings?: number;
  gatewayRevenue?: number;
}

// Helicone pricing tiers (per log/request)
const HELICONE_PRICING_TIERS = [
  { min: 0, max: 10000, rate: 0.0 },
  { min: 10000, max: 25000, rate: 0.0016 },
  { min: 25000, max: 50000, rate: 0.0008 },
  { min: 50000, max: 100000, rate: 0.00035 },
  { min: 100000, max: 2000000, rate: 0.0003 },
  { min: 2000000, max: 15000000, rate: 0.00013 },
  { min: 15000000, max: Infinity, rate: 0.00008 },
];

function calculateHeliconeRequestCost(requestCount: number): number {
  let totalCost = 0;
  let remainingRequests = requestCount;

  for (const tier of HELICONE_PRICING_TIERS) {
    if (remainingRequests <= 0) break;

    const requestsInTier = Math.min(
      remainingRequests,
      tier.max - tier.min
    );
    totalCost += requestsInTier * tier.rate;
    remainingRequests -= requestsInTier;
  }

  return totalCost;
}

@Route("v1/gateway")
@Tags("Gateway")
@Security("api_key")
export class GatewayController extends Controller {
  @Get("/eligibility")
  public async checkEligibility(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<GatewayEligibilityResponse, string>> {
    try {
      const orgId = request.authParams.organizationId;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Query for total requests and inference costs in last 30 days
      const metricsQuery = `
        SELECT
          COUNT(*) as request_count,
          SUM(cost) as total_inference_cost_nano_cents
        FROM request_response_rmt
        WHERE organization_id = {val_0:UUID}
          AND request_created_at >= {val_1:DateTime}
      `;

      const metricsData = await clickhouseDb.dbQuery<{
        request_count: number;
        total_inference_cost_nano_cents: number;
      }>(metricsQuery, [orgId, thirtyDaysAgo.toISOString()]);

      if (
        metricsData.error ||
        !metricsData.data ||
        metricsData.data.length === 0
      ) {
        return ok({
          shouldShowBanner: false,
          monthlyRequests: 0,
          monthlyInferenceCost: 0,
          reason: "no_data",
        });
      }

      const monthlyRequests = Number(metricsData.data[0].request_count) || 0;
      // Convert from nano cents to dollars (divide by 100,000,000)
      const monthlyInferenceCost = Number(metricsData.data[0].total_inference_cost_nano_cents) / 100_000_000 || 0;

      // Calculate what Helicone would make from request-based pricing
      const monthlyHeliconeeCost = calculateHeliconeRequestCost(monthlyRequests);

      // Calculate what Helicone would make from AI Gateway PTB (5-10% of inference)
      // Using 7.5% as a middle ground
      const GATEWAY_MARGIN = 0.075; // 7.5%
      const gatewayRevenue = monthlyInferenceCost * GATEWAY_MARGIN;

      // Show banner if:
      // 1. Gateway revenue would be higher than request-based pricing
      // 2. AND they have meaningful volume (>$100/month inference spend)
      const shouldShowBanner =
        gatewayRevenue > monthlyHeliconeeCost &&
        monthlyInferenceCost > 100;

      // Calculate potential savings for the customer
      // They save the Helicone request fees but pay the inference markup
      const potentialSavings = monthlyHeliconeeCost;

      let reason = "not_profitable";
      if (shouldShowBanner) {
        reason = "cost_benefit";
      } else if (monthlyInferenceCost < 100) {
        reason = "low_inference_spend";
      } else if (monthlyRequests < 10000) {
        reason = "not_enough_volume";
      }

      return ok({
        shouldShowBanner,
        monthlyRequests,
        monthlyInferenceCost,
        monthlyHeliconeeCost,
        potentialSavings,
        gatewayRevenue,
        reason,
      });
    } catch (error) {
      console.error("Error checking gateway eligibility:", error);
      this.setStatus(500);
      return err("Failed to check eligibility");
    }
  }
}
