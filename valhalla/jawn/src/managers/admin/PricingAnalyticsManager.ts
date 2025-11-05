import { AuthParams } from "../../packages/common/auth/types";
import { BaseManager } from "../BaseManager";
import { ok, err, Result } from "../../packages/common/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import Stripe from "stripe";
import { SecretManager } from "@helicone-package/secrets/SecretManager";
import { KVCache } from "../../lib/cache/kvCache";

// Cache for 1 hour - this is strategic analysis, not real-time monitoring
const pricingAnalyticsCache = new KVCache(60 * 60 * 1000);

// Types
export interface OrganizationSegment {
  id: string;
  name: string;
  tier: string;
  created_at: string;
  seats: number;
  active_users_30d: number;
  requests_30d: number;
  llm_cost_30d: number;
  prompts_created: number;
  prompts_used_30d: number;
  mrr: number;
  stripe_customer_id: string;
  is_ptb: boolean;
  is_byok: boolean;
}

export interface CohortData {
  high_inference_low_seats: OrganizationSegment[];
  low_inference_high_seats: OrganizationSegment[];
  ptb_customers: OrganizationSegment[];
  byok_customers: OrganizationSegment[];
  free_power_users: OrganizationSegment[];
}

export interface RevenueSummary {
  mrr_by_tier: {
    free: number;
    pro: number;
    team: number;
    enterprise: number;
  };
  total_mrr: number;
  addon_adoption: {
    prompts: number;
    experiments: number;
    evals: number;
  };
  gross_margin: number;
}

// Cohort classification thresholds
const THRESHOLDS = {
  high_requests: 100000, // 100k requests/month
  low_requests: 10000, // 10k requests/month
  high_seats: 5,
  low_seats: 2,
  free_power_user_requests: 50000, // 50k requests/month
};

export class PricingAnalyticsManager extends BaseManager {
  private stripe: Stripe;

  constructor(authParams: AuthParams) {
    super(authParams);
    this.stripe = new Stripe(
      SecretManager.getSecret("STRIPE_SECRET_KEY") || "",
      {
        apiVersion: "2025-02-24.acacia",
      }
    );
  }

  /**
   * Get all organization segments with usage and revenue data
   */
  async getSegments(bustCache?: boolean): Promise<Result<OrganizationSegment[], string>> {
    try {
      const startTime = Date.now();
      console.log("[PricingAnalytics] ⏱️  Starting getSegments...", { bustCache });

      // Check cache first (unless bustCache is true)
      const cacheKey = "pricing-analytics-segments";
      if (!bustCache) {
        const cached = await pricingAnalyticsCache.get<OrganizationSegment[]>(cacheKey);
        if (cached) {
          console.log(`[PricingAnalytics] ⚡ Cache HIT - returning instantly (${Date.now() - startTime}ms)`);
          return ok(cached);
        }
      } else {
        console.log("[PricingAnalytics] 💥 BUST CACHE - skipping cache check");
      }

      console.log("[PricingAnalytics] 🔄 Cache MISS - fetching fresh data");

      // 1. Get organizations with seat counts from PostgreSQL
      const pgStart = Date.now();
      console.log("[PricingAnalytics] 📊 Fetching organizations from PostgreSQL...");
      const orgsResult = await dbExecute<{
        id: string;
        name: string;
        tier: string;
        created_at: string;
        stripe_customer_id: string;
        seats: string;
      }>(
        `
        SELECT
          o.id,
          o.name,
          COALESCE(o.tier, 'free') as tier,
          o.created_at,
          o.stripe_customer_id,
          COALESCE(COUNT(om.member), 0)::text as seats
        FROM organization o
        LEFT JOIN organization_member om ON o.id = om.organization
        WHERE o.tier != 'demo' OR o.tier IS NULL
        GROUP BY o.id, o.name, o.tier, o.created_at, o.stripe_customer_id
        `,
        []
      );

      if (orgsResult.error || !orgsResult.data) {
        console.error("[PricingAnalytics] PostgreSQL error:", orgsResult.error);
        return err(`Failed to fetch organizations: ${orgsResult.error}`);
      }

      console.log(`[PricingAnalytics] ✅ PostgreSQL done: ${orgsResult.data.length} orgs (${Date.now() - pgStart}ms)`);

      // 2. Get active users from PostgreSQL
      const activeUsersStart = Date.now();
      console.log("[PricingAnalytics] 📊 Fetching active users from PostgreSQL...");
      const activeUsersResult = await dbExecute<{
        organization: string;
        active_users_30d: string;
      }>(
        `
        SELECT
          om.organization,
          COALESCE(COUNT(DISTINCT CASE
            WHEN um.last_active >= NOW() - INTERVAL '30 days'
            THEN om.member END), 0)::text as active_users_30d
        FROM organization_member om
        LEFT JOIN user_metrics um ON om.member = um.user_id
        GROUP BY om.organization
        `,
        []
      );

      if (activeUsersResult.error) {
        console.error("[PricingAnalytics] PostgreSQL active users error:", activeUsersResult.error);
        // Don't fail, just log and continue
        console.warn("[PricingAnalytics] Continuing without active users data");
      }

      console.log(`[PricingAnalytics] ✅ PostgreSQL active users done: ${activeUsersResult.data?.length || 0} orgs (${Date.now() - activeUsersStart}ms)`);

      // 3. Get prompts created from PostgreSQL
      const promptsCreatedStart = Date.now();
      console.log("[PricingAnalytics] 📊 Fetching prompts created from PostgreSQL...");
      const promptsCreatedResult = await dbExecute<{
        organization: string;
        prompts_created: string;
      }>(
        `
        SELECT
          organization,
          COUNT(*)::text as prompts_created
        FROM prompt_v2
        WHERE soft_delete = false
        GROUP BY organization
        `,
        []
      );

      if (promptsCreatedResult.error) {
        console.error("[PricingAnalytics] PostgreSQL prompts created error:", promptsCreatedResult.error);
        // Don't fail, just log and continue
        console.warn("[PricingAnalytics] Continuing without prompts created data");
      }

      console.log(`[PricingAnalytics] ✅ PostgreSQL prompts created done: ${promptsCreatedResult.data?.length || 0} orgs (${Date.now() - promptsCreatedStart}ms)`);

      // 4. Get 30-day usage from ClickHouse
      const ch30Start = Date.now();
      console.log("[PricingAnalytics] 📊 Fetching 30-day usage from ClickHouse...");
      const usage30dQuery = `
        SELECT
          organization_id,
          COUNT(*) as requests_30d,
          SUM(cost) / 1000000000 as llm_cost_30d,
          countIf(prompt_id != '') as prompts_used_30d,
          countIf(is_passthrough_billing = false) > 0 as is_byok
        FROM request_response_rmt
        WHERE request_created_at >= now() - INTERVAL 30 DAY
        GROUP BY organization_id
      `;

      const usage30d = await clickhouseDb.dbQuery<{
        organization_id: string;
        requests_30d: number;
        llm_cost_30d: number;
        prompts_used_30d: number;
        is_byok: number;
      }>(usage30dQuery, []);

      if (usage30d.error) {
        console.error("[PricingAnalytics] ClickHouse 30d error:", usage30d.error);
        return err(`Failed to fetch 30-day usage: ${usage30d.error}`);
      }

      console.log(`[PricingAnalytics] ✅ ClickHouse 30d done: ${usage30d.data?.length || 0} orgs (${Date.now() - ch30Start}ms)`);

      // 3. Get PTB organizations from ClickHouse materialized view (FAST!)
      const chPtbStart = Date.now();
      console.log("[PricingAnalytics] 📊 Fetching PTB customers from materialized view...");
      const ptbQuery = `
        SELECT organization_id
        FROM organization_ptb_spend
        WHERE spend > 0
      `;

      const ptbOrgs = await clickhouseDb.dbQuery<{
        organization_id: string;
      }>(ptbQuery, []);

      if (ptbOrgs.error) {
        console.error("[PricingAnalytics] ClickHouse PTB error:", ptbOrgs.error);
        // Don't fail, just log and continue
        console.warn("[PricingAnalytics] Continuing without PTB data");
      }

      console.log(`[PricingAnalytics] ✅ ClickHouse PTB done: ${ptbOrgs.data?.length || 0} customers (${Date.now() - chPtbStart}ms)`);

      const ptbOrgIds = new Set(
        ptbOrgs.data?.map((row) => row.organization_id) || []
      );

      // 6. Create lookup maps
      const mapStart = Date.now();
      console.log("[PricingAnalytics] 🗺️  Creating lookup maps...");

      const activeUsersMap = new Map(
        activeUsersResult.data?.map((row) => [
          row.organization,
          parseInt(row.active_users_30d),
        ]) || []
      );

      const promptsCreatedMap = new Map(
        promptsCreatedResult.data?.map((row) => [
          row.organization,
          parseInt(row.prompts_created),
        ]) || []
      );

      const usage30dMap = new Map(
        usage30d.data?.map((row) => [
          row.organization_id,
          {
            requests_30d: row.requests_30d,
            llm_cost_30d: row.llm_cost_30d,
            prompts_used_30d: row.prompts_used_30d,
            is_byok: row.is_byok === 1,
          },
        ]) || []
      );

      console.log(`[PricingAnalytics] ✅ Lookup maps created (${Date.now() - mapStart}ms)`);

      // 7. Skip Stripe calls for now (too slow - 50+ API calls)
      // TODO: Get MRR from database or implement async background job
      console.log("[PricingAnalytics] ⏭️  Skipping Stripe MRR fetch (too slow)");
      const mrrMap = new Map<string, number>();

      // 8. Combine all data
      const combineStart = Date.now();
      console.log("[PricingAnalytics] 🔗 Combining all data...");
      const segments: OrganizationSegment[] = orgsResult.data.map((org) => {
        const usage30 = usage30dMap.get(org.id) || {
          requests_30d: 0,
          llm_cost_30d: 0,
          prompts_used_30d: 0,
          is_byok: false,
        };
        const active_users_30d = activeUsersMap.get(org.id) || 0;
        const prompts_created = promptsCreatedMap.get(org.id) || 0;
        const mrr = mrrMap.get(org.id) || 0;
        const is_ptb = ptbOrgIds.has(org.id);

        return {
          id: org.id,
          name: org.name,
          tier: org.tier,
          created_at: org.created_at,
          seats: parseInt(org.seats),
          active_users_30d,
          requests_30d: usage30.requests_30d,
          llm_cost_30d: usage30.llm_cost_30d,
          prompts_created,
          prompts_used_30d: usage30.prompts_used_30d,
          mrr,
          stripe_customer_id: org.stripe_customer_id || "",
          is_ptb,
          is_byok: usage30.is_byok,
        };
      });

      console.log(`[PricingAnalytics] ✅ Data combined: ${segments.length} segments (${Date.now() - combineStart}ms)`);

      // Cache the results for 1 hour
      const cacheStart = Date.now();
      await pricingAnalyticsCache.set(cacheKey, segments);
      console.log(`[PricingAnalytics] ✅ Cached segments for 1 hour (${Date.now() - cacheStart}ms)`);

      const totalTime = Date.now() - startTime;
      console.log(`[PricingAnalytics] 🎉 TOTAL TIME: ${totalTime}ms`);

      return ok(segments);
    } catch (error) {
      console.error("[PricingAnalytics] Error in getSegments:", error);
      return err(`Failed to get segments: ${error}`);
    }
  }

  /**
   * Get cohorts classified by usage patterns
   */
  async getCohorts(): Promise<Result<CohortData, string>> {
    const segmentsResult = await this.getSegments();

    if (segmentsResult.error || !segmentsResult.data) {
      return err(segmentsResult.error || "No segments data");
    }

    const segments = segmentsResult.data;

    const cohorts: CohortData = {
      high_inference_low_seats: [],
      low_inference_high_seats: [],
      ptb_customers: [],
      byok_customers: [],
      free_power_users: [],
    };

    for (const org of segments) {
      // PTB customers
      if (org.is_ptb) {
        cohorts.ptb_customers.push(org);
      }

      // BYOK customers (non-PTB with tier)
      if (!org.is_ptb && org.tier !== "free") {
        cohorts.byok_customers.push(org);
      }

      // High inference / Low seats
      if (
        org.requests_30d > THRESHOLDS.high_requests &&
        org.seats <= THRESHOLDS.low_seats
      ) {
        cohorts.high_inference_low_seats.push(org);
      }

      // Low inference / High seats
      if (
        org.requests_30d < THRESHOLDS.low_requests &&
        org.seats >= THRESHOLDS.high_seats
      ) {
        cohorts.low_inference_high_seats.push(org);
      }

      // Free power users (upgrade candidates)
      if (
        org.tier === "free" &&
        org.requests_30d > THRESHOLDS.free_power_user_requests
      ) {
        cohorts.free_power_users.push(org);
      }
    }

    return ok(cohorts);
  }

  /**
   * Get revenue summary with MRR by tier and addon adoption
   */
  async getRevenueSummary(): Promise<Result<RevenueSummary, string>> {
    const segmentsResult = await this.getSegments();

    if (segmentsResult.error || !segmentsResult.data) {
      return err(segmentsResult.error || "No segments data");
    }

    const segments = segmentsResult.data;

    // Calculate MRR by tier
    const mrr_by_tier = {
      free: 0,
      pro: 0,
      team: 0,
      enterprise: 0,
    };

    let total_mrr = 0;

    for (const org of segments) {
      total_mrr += org.mrr;

      if (org.tier.includes("pro")) {
        mrr_by_tier.pro += org.mrr;
      } else if (org.tier.includes("team")) {
        mrr_by_tier.team += org.mrr;
      } else if (org.tier.includes("enterprise")) {
        mrr_by_tier.enterprise += org.mrr;
      } else {
        mrr_by_tier.free += org.mrr;
      }
    }

    // Get addon adoption counts
    // For now, we'll return placeholder values
    // In a real implementation, we'd query Stripe for addons or check stripe_metadata
    const addon_adoption = {
      prompts: 0,
      experiments: 0,
      evals: 0,
    };

    // TODO: Query actual addon adoption from Stripe metadata or subscription items

    // Calculate gross margin
    const total_llm_cost = segments.reduce(
      (sum, org) => sum + org.llm_cost_30d,
      0
    );
    const gross_margin =
      total_mrr > 0 ? ((total_mrr - total_llm_cost) / total_mrr) * 100 : 0;

    return ok({
      mrr_by_tier,
      total_mrr,
      addon_adoption,
      gross_margin,
    });
  }
}
