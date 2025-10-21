// src/users/usersController.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
  Query,
} from "tsoa";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import { prepareRequestAzure } from "../../lib/experiment/requestPrep/azure";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { Setting, SettingsManager } from "../../utils/settings";
import type { SettingName } from "../../utils/settings";
import Stripe from "stripe";
import { AdminManager } from "../../managers/admin/AdminManager";
import {
  ModelWithProvider,
  clickhouseModelFilter,
  clickhousePriceCalcNonAggregated,
} from "@helicone-package/cost";

import { err, ok, Result } from "../../packages/common/result";
import { InAppThread } from "../../managers/InAppThreadsManager";
import { HeliconeSqlManager } from "../../managers/HeliconeSqlManager";
import { HqlQueryManager } from "../../managers/HqlQueryManager";
import { HqlSavedQuery } from "../public/heliconeSqlController";

// Admin org ID for shared admin queries
const ADMIN_ORG_ID = "aff94038-3369-4ce9-957e-562fe5a79862";

export const authCheckThrow = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const result = await dbExecute<{ user_id: string }>(
    "SELECT user_id FROM admins WHERE user_id = $1",
    [userId]
  );

  if (result.error) {
    throw new Error(result.error || "Error checking authorization");
  }

  const hasAdmin = result.data
    ?.map((admin) => admin.user_id)
    .includes(userId as string);

  if (!hasAdmin) {
    throw new Error("Unauthorized");
  }
};

@Route("v1/admin")
@Tags("Admin")
@Security("api_key")
export class AdminController extends Controller {
  @Post("/has-feature-flag")
  public async hasFeatureFlag(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: { feature: string; orgId: string }
  ): Promise<Result<boolean, string>> {
    try {
      const { data } = await dbExecute<{
        id: string;
      }>(`SELECT id FROM feature_flags WHERE org_id = $1 AND feature = $2`, [
        body.orgId,
        body.feature,
      ]);

      return ok(!!(data && data.length > 0));
    } catch (e) {
      console.error("Error checking feature flag:", e);
      return err("Error checking feature flag");
    }
  }

  @Post("/feature-flags")
  public async updateFeatureFlags(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: { flag: string; orgId: string }
  ) {
    await authCheckThrow(request.authParams.userId);

    const { flag, orgId } = body;

    await dbExecute(
      `INSERT INTO feature_flags (org_id, feature) VALUES ($1, $2)`,
      [orgId, flag]
    );
  }

  @Delete("/feature-flags")
  public async deleteFeatureFlag(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: { flag: string; orgId: string }
  ) {
    await authCheckThrow(request.authParams.userId);

    await dbExecute(
      `DELETE FROM feature_flags WHERE org_id = $1 AND feature = $2`,
      [body.orgId, body.flag]
    );
  }

  @Post("/feature-flags/query")
  public async getFeatureFlags(@Request() request: JawnAuthenticatedRequest) {
    await authCheckThrow(request.authParams.userId);

    return await dbExecute<{
      organization_id: string;
      name: string;
      flags: string[];
    }>(
      `
      SELECT 
        organization.id AS organization_id,
        organization.name AS name,
        array_agg(feature) as flags
      FROM feature_flags 
        LEFT JOIN organization ON feature_flags.org_id = organization.id
      GROUP BY organization.id, organization.name
      `,
      []
    );
  }

  @Post("/orgs/top-usage")
  public async getTopOrgsByUsage(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      limit: number;
      minRequests: number;
    }
  ): Promise<{
    organizations: Array<{
      organization: {
        id: string;
        name: string;
        created_at: string;
        owner: string;
        tier: string;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        subscription_status: string | null;
        members: {
          id: string;
          email: string;
          name: string;
          role: string;
          last_sign_in_at: string | null;
        }[];
      };
      usage: {
        total_requests: number;
        requests_last_30_days: number;
        monthly_usage: {
          month: string;
          requestCount: number;
        }[];
        all_time_count: number;
      };
    }>;
  }> {
    await authCheckThrow(request.authParams.userId);

    const limit = body.limit ?? 10;
    const minRequests = body.minRequests ?? 1_000_000;

    // Fetch top organizations by usage in the past month
    const topOrgsQuery = `
      SELECT
        organization_id,
        COUNT(*) as request_count
      FROM request_response_rmt
      WHERE request_created_at >= now() - INTERVAL 30 DAY
      GROUP BY organization_id
      HAVING request_count >= ${minRequests}
      ORDER BY request_count DESC
      LIMIT ${limit}
    `;

    const topOrgsResult = await clickhouseDb.dbQuery<{
      organization_id: string;
      request_count: string;
    }>(topOrgsQuery, []);

    if (!topOrgsResult.data || topOrgsResult.data.length === 0) {
      return { organizations: [] };
    }

    const orgIds = topOrgsResult.data.map((org) => org.organization_id);

    // Fetch organization details
    const orgQuery = `
      SELECT
        o.id, o.name, o.created_at, o.owner, o.tier,
        o.stripe_customer_id, o.stripe_subscription_id, o.subscription_status,
        json_agg(
          json_build_object(
            'id', om.member,
            'email', u.email,
            'name', u.raw_user_meta_data->>'name',
            'role', om.org_role,
            'last_sign_in_at', u.last_sign_in_at,
            'created_at', u.created_at
          )
        ) AS members
      FROM organization o
      LEFT JOIN organization_member om ON o.id = om.organization
      LEFT JOIN auth.users u ON om.member = u.id
      WHERE o.id = ANY($1::uuid[])
      GROUP BY o.id
    `;

    const orgResult = await dbExecute<{
      id: string;
      name: string;
      created_at: string;
      owner: string;
      tier: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      subscription_status: string | null;
      members: {
        id: string;
        email: string;
        name: string;
        role: string;
        last_sign_in_at: string | null;
      }[];
    }>(orgQuery, [orgIds]);

    // Fetch usage data for each organization
    const usagePromises = orgIds.map(async (orgId) => {
      const usageQuery = `
        SELECT
          count(*) as total_requests,
          countIf(request_created_at >= now() - INTERVAL 30 DAY) as requests_last_30_days
        FROM request_response_rmt
        WHERE organization_id = {val_0:String}
      `;

      const monthlyUsageQuery = `
        SELECT
          toStartOfMonth(request_created_at) AS month,
          COUNT(*) AS requestCount
        FROM
          request_response_rmt
        WHERE
          request_created_at > now() - INTERVAL 3 MONTH
          AND organization_id = {val_0:String}
        GROUP BY
          toStartOfMonth(request_created_at)
        ORDER BY
          month DESC
      `;

      const allTimeCountQuery = `
        SELECT count(*) as all_time_count
        FROM request_response_rmt
        WHERE organization_id = {val_0:String}
      `;

      const [usageResult, monthlyUsageResult, allTimeCountResult] =
        await Promise.all([
          clickhouseDb.dbQuery<{
            total_requests: string;
            requests_last_30_days: string;
          }>(usageQuery, [orgId]),
          clickhouseDb.dbQuery<{
            month: string;
            requestCount: string;
          }>(monthlyUsageQuery, [orgId]),
          clickhouseDb.dbQuery<{
            all_time_count: string;
          }>(allTimeCountQuery, [orgId]),
        ]);

      const usage = usageResult.data?.[0] ?? {
        total_requests: 0,
        requests_last_30_days: 0,
      };

      const monthlyUsage = monthlyUsageResult.data ?? [];
      const allTimeCount = allTimeCountResult.data?.[0]?.all_time_count ?? "0";

      return {
        orgId,
        usage: {
          total_requests: Number(usage.total_requests),
          requests_last_30_days: Number(usage.requests_last_30_days),
          monthly_usage: monthlyUsage.map((item) => ({
            month: item.month,
            requestCount: Number(item.requestCount),
          })),
          all_time_count: Number(allTimeCount),
        },
      };
    });

    const usageResults = await Promise.all(usagePromises);

    // Combine organization details with usage data and sort
    const organizations = orgResult.data
      ?.map((org) => {
        const usage = usageResults.find((u) => u.orgId === org.id)?.usage;
        return {
          organization: {
            id: org.id,
            name: org.name,
            created_at: org.created_at,
            owner: org.owner,
            tier: org.tier,
            stripe_customer_id: org.stripe_customer_id,
            stripe_subscription_id: org.stripe_subscription_id,
            subscription_status: org.subscription_status,
            members: org.members,
          },
          usage: usage!,
        };
      })
      .sort(
        (a, b) => b.usage.requests_last_30_days - a.usage.requests_last_30_days
      );

    return { organizations: organizations ?? [] };
  }

  @Post("/orgs/top")
  public async getTopOrgs(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      startDate: string;
      endDate: string;
      tier: "all" | "pro" | "free" | "growth" | "enterprise";
      orgsId?: string[];
      orgsNameContains?: string[];
      emailContains?: string[];
    }
  ) {
    console.log("getTopOrgs");
    await authCheckThrow(request.authParams.userId);
    const orgData = await dbExecute<{
      id: string;
      tier: string;
      owner_email: string;
      owner_last_login: string;
      name: string;
      members: {
        id: string;
        email: string;
        role: string;
        last_active: string;
      }[];
    }>(
      `
    SELECT
      organization.name AS name,
      organization.id AS id,
      organization.tier AS tier,
      users_view.email AS owner_email,
      users_view.last_sign_in_at AS owner_last_login,
      json_agg(
          json_build_object(
              'id', organization_member.member,
              'email', member_user.email,
              'role', organization_member.org_role,
              'last_active', member_user.last_sign_in_at
          )
      ) AS members
    FROM organization
    LEFT JOIN users_view ON organization.owner = users_view.id
    LEFT JOIN organization_member ON organization.id = organization_member.organization
    LEFT JOIN users_view AS member_user ON organization_member.member = member_user.id
    WHERE (
      true
      ${body.tier !== "all" ? `AND organization.tier = $1` : ""}
    )
    GROUP BY
      organization.id,
      organization.tier,
      users_view.email,
      users_view.last_sign_in_at;
    `,
      body.tier !== "all" ? [body.tier] : []
    );

    if (!orgData.data) {
      return [];
    }

    // Step 1: Fetch top organizations
    const orgIds = orgData.data?.map((org) => org.id).slice(0, 30) ?? [];

    if (orgIds.length === 0) {
      return [];
    }

    // Build IN clause with individual parameters for safety
    const orgIdParams = orgIds.map((_, index) => `{val_${index + 2}:String}`).join(", ");

    const orgs = await clickhouseDb.dbQuery<{
      organization_id: string;
      ct: number;
    }>(
      `
    SELECT
      organization_id,
      count(*) as ct
    FROM request_response_rmt
    WHERE
      request_response_rmt.request_created_at > {val_0:DateTime}
      and request_response_rmt.request_created_at < {val_1:DateTime}
    AND organization_id in (${orgIdParams})
    GROUP BY organization_id
    ORDER BY ct DESC
    `,
      [body.startDate, body.endDate, ...orgIds]
    );

    if (!orgs.data) {
      return [];
    }

    if (body.orgsId) {
      orgs.data = orgs.data.filter((org) =>
        body.orgsId?.includes(org.organization_id)
      );
    }
    if (!orgs.data) {
      return [];
    }
    // Step 2: Fetch organization details including members

    orgs.data = orgs.data?.filter((org) =>
      orgData.data?.find((od) => od.id === org.organization_id)
    );

    if (body.orgsNameContains) {
      orgs.data = orgs.data?.filter((org) =>
        body.orgsNameContains?.some((name) =>
          orgData.data
            ?.find((od) => od.id === org.organization_id)
            ?.name.toLowerCase()
            .includes(name.toLowerCase())
        )
      );
    }

    if (body.emailContains) {
      orgs.data = orgs.data?.filter((org) =>
        body.emailContains?.some((email) =>
          orgData.data
            ?.find((od) => od.id === org.organization_id)
            ?.owner_email.toLowerCase()
            .includes(email.toLowerCase())
        )
      );
    }

    let timeGrain = "minute";
    if (
      new Date(body.endDate).getTime() - new Date(body.startDate).getTime() >
      12 * 60 * 60 * 1000
    ) {
      timeGrain = "hour";
    }
    if (
      new Date(body.endDate).getTime() - new Date(body.startDate).getTime() >
      30 * 24 * 60 * 60 * 1000
    ) {
      timeGrain = "day";
    }

    if (!orgs.data || orgs.data.length === 0) {
      return [];
    }
    // Step 3: Fetch organization data over time
    const orgIdsForTimeSeries = orgs.data?.map((org) => org.organization_id).slice(0, 30) ?? [];

    // Build IN clause with individual parameters
    const timeSeriesOrgParams = orgIdsForTimeSeries.map((_, index) => `{val_${index + 2}:String}`).join(", ");

    const orgsOverTime = await clickhouseDb.dbQuery<{
      count: number;
      dt: string;
      organization_id: string;
    }>(
      `
      select
        count(*) as count,
        date_trunc('${timeGrain}', request_created_at) AS dt,
        request_response_rmt.organization_id as organization_id
      from request_response_rmt
      where request_response_rmt.organization_id in (${timeSeriesOrgParams})
      and request_response_rmt.request_created_at > {val_0:DateTime}
      and request_response_rmt.request_created_at < {val_1:DateTime}
      group by dt, organization_id
      order by organization_id, dt ASC
      WITH FILL FROM toDateTime64('${body.startDate}') TO toDateTime64('${body.endDate}') STEP INTERVAL 1 ${timeGrain}
    `,
      [body.startDate, body.endDate, ...orgIdsForTimeSeries]
    );

    // Step 4: Merge all data into one massive object
    const mergedData = orgs.data!.map((org) => {
      const orgDetail = orgData.data!.find(
        (od) => od?.id! === org.organization_id
      );
      const orgOverTime = orgsOverTime.data!.filter(
        (ot) => ot!.organization_id! === org.organization_id
      );

      return {
        ...org,
        ...orgDetail,
        overTime: orgOverTime,
      };
    });

    return mergedData;
  }

  @Get("/admins/query")
  public async getAdmins(@Request() request: JawnAuthenticatedRequest): Promise<
    {
      created_at: string;
      id: number;
      user_email: string | null;
      user_id: string | null;
    }[]
  > {
    await authCheckThrow(request.authParams.userId);

    const { data } = await dbExecute<{
      user_email: string | null;
      id: number;
      created_at: string;
      user_id: string | null;
    }>(
      `
      SELECT user_email, id, created_at, user_id FROM
      admins
      `,
      []
    );

    return data ?? [];
  }

  @Post("/whodis")
  public async whodis(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      organizationId?: string;
      userId?: string;
      email?: string;
    }
  ): Promise<{
    organizations: Array<{
      organization: {
        id: string;
        name: string;
        created_at: string;
        owner: string;
        tier: string;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        subscription_status: string | null;
        members: {
          id: string;
          email: string;
          name: string;
          role: string;
          last_sign_in_at: string | null;
        }[];
      };
      usage: {
        total_requests: number;
        requests_last_30_days: number;
        monthly_usage: {
          month: string;
          requestCount: number;
        }[];
        all_time_count: number;
      };
    }>;
  }> {
    await authCheckThrow(request.authParams.userId);

    const { organizationId, userId, email } = body;

    if (!organizationId && !userId && !email) {
      throw new Error(
        "At least one of organizationId, userId, or email must be provided"
      );
    }

    let orgQuery = `
      WITH matching_orgs AS (
        SELECT DISTINCT o.id
        FROM organization o
        LEFT JOIN organization_member om ON o.id = om.organization
        LEFT JOIN auth.users u ON om.member = u.id OR o.owner = u.id
        WHERE ${
          organizationId
            ? "o.id = $1"
            : userId
              ? "om.member = $1"
              : "u.email = $1"
        }
      )
      SELECT
        o.id, o.name, o.created_at, o.owner, o.tier,
        o.stripe_customer_id, o.stripe_subscription_id, o.subscription_status,
        json_agg(
          json_build_object(
            'id', om.member,
            'email', u.email,
            'name', u.raw_user_meta_data->>'name',
            'role', om.org_role,
            'last_sign_in_at', u.last_sign_in_at,
            'created_at', u.created_at
          )
        ) AS members
      FROM organization o
      LEFT JOIN organization_member om ON o.id = om.organization
      LEFT JOIN auth.users u ON om.member = u.id
      WHERE o.id IN (SELECT id FROM matching_orgs)
      GROUP BY o.id
    `;

    const queryParams: any[] = [];

    if (organizationId) {
      queryParams.push(organizationId);
    } else if (userId) {
      queryParams.push(userId);
    } else if (email) {
      queryParams.push(email);
    }

    const orgResult = await dbExecute<{
      id: string;
      name: string;
      created_at: string;
      owner: string;
      tier: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      subscription_status: string | null;
      members: {
        id: string;
        email: string;
        name: string;
        role: string;
        last_sign_in_at: string | null;
      }[];
    }>(orgQuery, queryParams);

    if (!orgResult.data || orgResult.data.length === 0) {
      return { organizations: [] };
    }

    const organizations = await Promise.all(
      orgResult.data.map(async (org) => {
        // Fetch usage data from ClickHouse
        const usageQuery = `
        SELECT
          count(*) as total_requests,
          countIf(request_created_at >= now() - INTERVAL 30 DAY) as requests_last_30_days
        FROM request_response_rmt
        WHERE organization_id = {val_0:String}
      `;

        const monthlyUsageQuery = `
        SELECT
          toStartOfMonth(request_created_at) AS month,
          COUNT(*) AS requestCount
        FROM
          request_response_rmt
        WHERE
          request_created_at > now() - INTERVAL 12 MONTH
          AND organization_id = {val_0:String}
        GROUP BY
          toStartOfMonth(request_created_at)
        ORDER BY
          month DESC
      `;

        const allTimeCountQuery = `
        SELECT count(*) as all_time_count
        FROM request_response_rmt
        WHERE organization_id = {val_0:String}
      `;

        const [usageResult, monthlyUsageResult, allTimeCountResult] =
          await Promise.all([
            clickhouseDb.dbQuery<{
              total_requests: string;
              requests_last_30_days: string;
            }>(usageQuery, [org.id]),
            clickhouseDb.dbQuery<{
              month: string;
              requestCount: string;
            }>(monthlyUsageQuery, [org.id]),
            clickhouseDb.dbQuery<{
              all_time_count: string;
            }>(allTimeCountQuery, [org.id]),
          ]);

        const usage = usageResult.data?.[0] ?? {
          total_requests: 0,
          requests_last_30_days: 0,
        };

        const monthlyUsage = monthlyUsageResult.data ?? [];
        const allTimeCount =
          allTimeCountResult.data?.[0]?.all_time_count ?? "0";

        return {
          organization: {
            id: org.id,
            name: org.name,
            created_at: org.created_at,
            owner: org.owner,
            tier: org.tier,
            stripe_customer_id: org.stripe_customer_id,
            stripe_subscription_id: org.stripe_subscription_id,
            subscription_status: org.subscription_status,
            members: org.members,
          },
          usage: {
            total_requests: Number(usage.total_requests),
            requests_last_30_days: Number(usage.requests_last_30_days),
            monthly_usage: monthlyUsage.map((item) => ({
              month: item.month,
              requestCount: Number(item.requestCount),
            })),
            all_time_count: Number(allTimeCount),
          },
        };
      })
    );

    return { organizations };
  }

  @Post("/org-search")
  public async orgSearch(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      query: string;
    }
  ): Promise<{
    organizations: Array<{
      organization: {
        id: string;
        name: string;
        created_at: string;
        owner: string;
        tier: string;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        subscription_status: string | null;
        members: {
          id: string;
          email: string;
          name: string;
          role: string;
          last_sign_in_at: string | null;
        }[];
      };
      usage: {
        total_requests: number;
        requests_last_30_days: number;
        monthly_usage: {
          month: string;
          requestCount: number;
        }[];
        all_time_count: number;
      };
    }>;
  }> {
    await authCheckThrow(request.authParams.userId);

    const { query } = body;

    if (!query || query.trim().length === 0) {
      return { organizations: [] };
    }

    // Intelligent search across multiple fields
    const orgQuery = `
      WITH matching_orgs AS (
        SELECT DISTINCT o.id
        FROM organization o
        LEFT JOIN organization_member om ON o.id = om.organization
        LEFT JOIN auth.users u ON om.member = u.id OR o.owner = u.id
        WHERE
          o.id::text = $1
          OR o.name ILIKE '%' || $1 || '%'
          OR u.email ILIKE '%' || $1 || '%'
          OR u.id::text = $1
      )
      SELECT
        o.id, o.name, o.created_at, o.owner, o.tier,
        o.stripe_customer_id, o.stripe_subscription_id, o.subscription_status,
        json_agg(
          json_build_object(
            'id', om.member,
            'email', u.email,
            'name', u.raw_user_meta_data->>'name',
            'role', om.org_role,
            'last_sign_in_at', u.last_sign_in_at,
            'created_at', u.created_at
          )
        ) AS members
      FROM organization o
      LEFT JOIN organization_member om ON o.id = om.organization
      LEFT JOIN auth.users u ON om.member = u.id
      WHERE o.id IN (SELECT id FROM matching_orgs)
      GROUP BY o.id
      LIMIT 20
    `;

    const orgResult = await dbExecute<{
      id: string;
      name: string;
      created_at: string;
      owner: string;
      tier: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      subscription_status: string | null;
      members: {
        id: string;
        email: string;
        name: string;
        role: string;
        last_sign_in_at: string | null;
      }[];
    }>(orgQuery, [query.trim()]);

    if (!orgResult.data || orgResult.data.length === 0) {
      return { organizations: [] };
    }

    const organizations = await Promise.all(
      orgResult.data.map(async (org) => {
        // Fetch usage data from ClickHouse
        const usageQuery = `
        SELECT
          count(*) as total_requests,
          countIf(request_created_at >= now() - INTERVAL 30 DAY) as requests_last_30_days
        FROM request_response_rmt
        WHERE organization_id = {val_0:String}
      `;

        const monthlyUsageQuery = `
        SELECT
          toStartOfMonth(request_created_at) AS month,
          COUNT(*) AS requestCount
        FROM
          request_response_rmt
        WHERE
          request_created_at > now() - INTERVAL 12 MONTH
          AND organization_id = {val_0:String}
        GROUP BY
          toStartOfMonth(request_created_at)
        ORDER BY
          month DESC
      `;

        const allTimeCountQuery = `
        SELECT count(*) as all_time_count
        FROM request_response_rmt
        WHERE organization_id = {val_0:String}
      `;

        const [usageResult, monthlyUsageResult, allTimeCountResult] =
          await Promise.all([
            clickhouseDb.dbQuery<{
              total_requests: string;
              requests_last_30_days: string;
            }>(usageQuery, [org.id]),
            clickhouseDb.dbQuery<{
              month: string;
              requestCount: string;
            }>(monthlyUsageQuery, [org.id]),
            clickhouseDb.dbQuery<{
              all_time_count: string;
            }>(allTimeCountQuery, [org.id]),
          ]);

        const usage = usageResult.data?.[0] ?? {
          total_requests: 0,
          requests_last_30_days: 0,
        };

        const monthlyUsage = monthlyUsageResult.data ?? [];
        const allTimeCount =
          allTimeCountResult.data?.[0]?.all_time_count ?? "0";

        return {
          organization: {
            id: org.id,
            name: org.name,
            created_at: org.created_at,
            owner: org.owner,
            tier: org.tier,
            stripe_customer_id: org.stripe_customer_id,
            stripe_subscription_id: org.stripe_subscription_id,
            subscription_status: org.subscription_status,
            members: org.members,
          },
          usage: {
            total_requests: Number(usage.total_requests),
            requests_last_30_days: Number(usage.requests_last_30_days),
            monthly_usage: monthlyUsage.map((item) => ({
              month: item.month,
              requestCount: Number(item.requestCount),
            })),
            all_time_count: Number(allTimeCount),
          },
        };
      })
    );

    return { organizations };
  }

  @Post("/org-search-fast")
  public async orgSearchFast(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      query: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    organizations: Array<{
      id: string;
      name: string;
      created_at: string;
      owner: string;
      tier: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      subscription_status: string | null;
      members: {
        id: string;
        email: string;
        name: string;
        role: string;
        last_sign_in_at: string | null;
      }[];
    }>;
    total: number;
    hasMore: boolean;
  }> {
    await authCheckThrow(request.authParams.userId);

    const { query, limit = 50, offset = 0 } = body;

    if (!query || query.trim().length === 0) {
      return { organizations: [], total: 0, hasMore: false };
    }

    // Fast search - only org details, no usage data
    // Filter out demo orgs and sort by match relevance
    const orgQuery = `
      WITH matching_orgs AS (
        SELECT DISTINCT
          o.id,
          CASE
            -- Exact org ID match (highest priority)
            WHEN o.id::text = $1 THEN 1
            -- Exact org name match (case-insensitive)
            WHEN LOWER(o.name) = LOWER($1) THEN 2
            -- Exact email match
            WHEN EXISTS (
              SELECT 1 FROM organization_member om2
              LEFT JOIN auth.users u2 ON om2.member = u2.id
              WHERE om2.organization = o.id
              AND LOWER(u2.email) = LOWER($1)
            ) OR EXISTS (
              SELECT 1 FROM auth.users u2
              WHERE u2.id = o.owner
              AND LOWER(u2.email) = LOWER($1)
            ) THEN 3
            -- Exact user ID match
            WHEN EXISTS (
              SELECT 1 FROM organization_member om2
              WHERE om2.organization = o.id
              AND om2.member::text = $1
            ) OR o.owner::text = $1 THEN 4
            -- Org name starts with query
            WHEN o.name ILIKE $1 || '%' THEN 5
            -- Email starts with query (e.g., query is email prefix or domain)
            WHEN EXISTS (
              SELECT 1 FROM organization_member om2
              LEFT JOIN auth.users u2 ON om2.member = u2.id
              WHERE om2.organization = o.id
              AND u2.email ILIKE $1 || '%'
            ) OR EXISTS (
              SELECT 1 FROM auth.users u2
              WHERE u2.id = o.owner
              AND u2.email ILIKE $1 || '%'
            ) THEN 6
            -- Org name contains query
            WHEN o.name ILIKE '%' || $1 || '%' THEN 7
            -- Email contains query (e.g., partial email or domain)
            WHEN EXISTS (
              SELECT 1 FROM organization_member om2
              LEFT JOIN auth.users u2 ON om2.member = u2.id
              WHERE om2.organization = o.id
              AND u2.email ILIKE '%' || $1 || '%'
            ) OR EXISTS (
              SELECT 1 FROM auth.users u2
              WHERE u2.id = o.owner
              AND u2.email ILIKE '%' || $1 || '%'
            ) THEN 8
            -- Default lowest priority
            ELSE 9
          END as match_score
        FROM organization o
        WHERE
          o.tier != 'demo'
          AND (
            o.id::text = $1
            OR o.name ILIKE '%' || $1 || '%'
            OR EXISTS (
              SELECT 1 FROM organization_member om2
              LEFT JOIN auth.users u2 ON om2.member = u2.id
              WHERE om2.organization = o.id
              AND (u2.email ILIKE '%' || $1 || '%' OR om2.member::text = $1)
            )
            OR EXISTS (
              SELECT 1 FROM auth.users u2
              WHERE u2.id = o.owner
              AND (u2.email ILIKE '%' || $1 || '%' OR o.owner::text = $1)
            )
          )
      )
      SELECT
        o.id, o.name, o.created_at, o.owner, o.tier,
        o.stripe_customer_id, o.stripe_subscription_id, o.subscription_status,
        m.match_score,
        json_agg(
          json_build_object(
            'id', om.member,
            'email', u.email,
            'name', u.raw_user_meta_data->>'name',
            'role', om.org_role,
            'last_sign_in_at', u.last_sign_in_at,
            'created_at', u.created_at
          )
        ) AS members
      FROM organization o
      INNER JOIN matching_orgs m ON o.id = m.id
      LEFT JOIN organization_member om ON o.id = om.organization
      LEFT JOIN auth.users u ON om.member = u.id
      GROUP BY o.id, o.name, o.created_at, o.owner, o.tier,
               o.stripe_customer_id, o.stripe_subscription_id, o.subscription_status, m.match_score
      ORDER BY m.match_score ASC, o.name ASC
      LIMIT $2 OFFSET $3
    `;

    // Count total matching orgs
    const countQuery = `
      WITH matching_orgs AS (
        SELECT DISTINCT o.id
        FROM organization o
        WHERE
          o.tier != 'demo'
          AND (
            o.id::text = $1
            OR o.name ILIKE '%' || $1 || '%'
            OR EXISTS (
              SELECT 1 FROM organization_member om2
              LEFT JOIN auth.users u2 ON om2.member = u2.id
              WHERE om2.organization = o.id
              AND (u2.email ILIKE '%' || $1 || '%' OR om2.member::text = $1)
            )
            OR EXISTS (
              SELECT 1 FROM auth.users u2
              WHERE u2.id = o.owner
              AND (u2.email ILIKE '%' || $1 || '%' OR o.owner::text = $1)
            )
          )
      )
      SELECT COUNT(*) as total FROM matching_orgs
    `;

    const [orgResult, countResult] = await Promise.all([
      dbExecute<{
        id: string;
        name: string;
        created_at: string;
        owner: string;
        tier: string;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        subscription_status: string | null;
        match_score: number;
        members: {
          id: string;
          email: string;
          name: string;
          role: string;
          last_sign_in_at: string | null;
        }[];
      }>(orgQuery, [query.trim(), limit, offset]),
      dbExecute<{ total: string }>(countQuery, [query.trim()]),
    ]);

    // Remove match_score from results before returning
    const organizations = orgResult.data?.map(({ match_score, ...org }) => org) ?? [];
    const total = parseInt(countResult.data?.[0]?.total ?? "0", 10);
    const hasMore = offset + limit < total;

    return { organizations, total, hasMore };
  }

  @Post("/user-search")
  public async userSearch(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      query: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    users: Array<{
      id: string;
      email: string;
      name: string | null;
      created_at: string;
      last_sign_in_at: string | null;
      is_admin: boolean;
      organizations: {
        id: string;
        name: string | null;
        role: string | null;
      }[];
    }>;
    total: number;
    hasMore: boolean;
  }> {
    await authCheckThrow(request.authParams.userId);

    const { query, limit = 50, offset = 0 } = body;

    if (!query || query.trim().length === 0) {
      return { users: [], total: 0, hasMore: false };
    }

    const sanitizedQuery = query.trim();
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const userQuery = `
      WITH matching_users AS (
        SELECT
          u.id,
          u.email,
          u.created_at,
          u.last_sign_in_at,
          u.raw_user_meta_data->>'name' AS name,
          CASE
            WHEN LOWER(u.email) = LOWER($1) THEN 1
            WHEN u.email ILIKE $1 || '%' THEN 2
            WHEN u.email ILIKE '%' || $1 || '%' THEN 3
            WHEN u.id::text = $1 THEN 4
            ELSE 5
          END AS match_score
        FROM auth.users u
        WHERE
          u.email ILIKE '%' || $1 || '%'
          OR u.id::text = $1
        ORDER BY match_score, LOWER(u.email)
        LIMIT $2 OFFSET $3
      )
      SELECT
        mu.id,
        mu.email,
        mu.created_at,
        mu.last_sign_in_at,
        mu.name,
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', om.organization,
              'name', org.name,
              'role', om.org_role
            )
          ) FILTER (WHERE om.organization IS NOT NULL),
          '[]'::jsonb
        ) AS organizations,
        EXISTS(
          SELECT 1 FROM admins a WHERE a.user_id = mu.id
        ) AS is_admin,
        mu.match_score
      FROM matching_users mu
      LEFT JOIN organization_member om ON om.member = mu.id
      LEFT JOIN organization org ON org.id = om.organization
      GROUP BY
        mu.id,
        mu.email,
        mu.created_at,
        mu.last_sign_in_at,
        mu.name,
        mu.match_score
      ORDER BY mu.match_score, mu.email
    `;

    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM auth.users u
      WHERE
        u.email ILIKE '%' || $1 || '%'
        OR u.id::text = $1
    `;

    const [userResult, countResult] = await Promise.all([
      dbExecute<{
        id: string;
        email: string;
        created_at: string;
        last_sign_in_at: string | null;
        name: string | null;
        organizations: {
          id: string;
          name: string | null;
          role: string | null;
        }[] | null;
        is_admin: boolean;
        match_score: number;
      }>(userQuery, [sanitizedQuery, safeLimit, safeOffset]),
      dbExecute<{ total: number }>(countQuery, [sanitizedQuery]),
    ]);

    const users =
      userResult.data?.map(
        ({ match_score: _match, organizations, ...user }) => ({
          ...user,
          organizations: Array.isArray(organizations) ? organizations : [],
        })
      ) ?? [];

    const total = Number(countResult.data?.[0]?.total ?? 0);
    const hasMore = safeOffset + users.length < total;

    return { users, total, hasMore };
  }

  @Delete("/org/{orgId}/member/{memberId}")
  public async removeOrgMember(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Path() memberId: string
  ): Promise<Result<null, string>> {
    await authCheckThrow(request.authParams.userId);

    const { error } = await dbExecute(
      `DELETE FROM organization_member WHERE organization = $1 AND member = $2`,
      [orgId, memberId]
    );

    if (error) {
      return err(error);
    }

    return ok(null);
  }

  @Patch("/org/{orgId}/member/{memberId}")
  public async updateOrgMemberRole(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Path() memberId: string,
    @Body() body: { role: string }
  ): Promise<Result<null, string>> {
    await authCheckThrow(request.authParams.userId);

    // If changing to owner, we need to transfer ownership
    if (body.role.toLowerCase() === "owner") {
      // Start a transaction to transfer ownership
      // 1. Demote current owner to admin
      // 2. Promote new member to owner
      // 3. Update organization.owner
      const transferResult = await dbExecute(
        `
        WITH current_owner AS (
          SELECT member
          FROM organization_member
          WHERE organization = $1 AND org_role = 'owner'
        )
        UPDATE organization_member
        SET org_role = CASE
          WHEN member = $2 THEN 'owner'
          WHEN member IN (SELECT member FROM current_owner) THEN 'admin'
          ELSE org_role
        END
        WHERE organization = $1
          AND (member = $2 OR member IN (SELECT member FROM current_owner));

        UPDATE organization
        SET owner = $2
        WHERE id = $1;
        `,
        [orgId, memberId]
      );

      if (transferResult.error) {
        return err(transferResult.error);
      }

      return ok(null);
    }

    // For non-owner roles, just update normally
    const { error } = await dbExecute(
      `UPDATE organization_member SET org_role = $1 WHERE organization = $2 AND member = $3`,
      [body.role, orgId, memberId]
    );

    if (error) {
      return err(error);
    }

    return ok(null);
  }

  @Post("/org/{orgId}/pricing-config")
  public async updateOrgPricingConfig(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Body() body: { endpointMultipliers: Record<string, number> }
  ): Promise<Result<null, string>> {
    await authCheckThrow(request.authParams.userId);

    const { endpointMultipliers } = body;

    // Validate each multiplier
    for (const [endpoint, multiplier] of Object.entries(endpointMultipliers)) {
      if (multiplier < 0 || multiplier > 2 || isNaN(multiplier)) {
        return err(`Invalid multiplier for ${endpoint}: must be between 0 and 2`);
      }

      // Validate endpoint key format (should contain colon)
      if (!endpoint.includes(':')) {
        return err(`Invalid endpoint key format: ${endpoint}`);
      }
    }

    const { error } = await dbExecute(
      `UPDATE organization
       SET pricing_config = jsonb_set(
         COALESCE(pricing_config, '{}'),
         '{endpointMultipliers}',
         $1::jsonb
       )
       WHERE id = $2`,
      [JSON.stringify(endpointMultipliers), orgId]
    );

    if (error) {
      return err(error);
    }

    return ok(null);
  }

  @Post("/org/{orgId}/delete")
  public async deleteOrg(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<Result<null, string>> {
    await authCheckThrow(request.authParams.userId);

    // Hardcoded target owner email for security - never trust frontend input
    const TARGET_OWNER_EMAIL = "cole+10@helicone.ai";

    // Get the target owner user ID from email
    const targetUserResult = await dbExecute<{ id: string }>(
      `SELECT id FROM auth.users WHERE email = $1`,
      [TARGET_OWNER_EMAIL]
    );

    if (targetUserResult.error || !targetUserResult.data?.[0]) {
      return err(`Target owner email not found: ${TARGET_OWNER_EMAIL}`);
    }

    const targetUserId = targetUserResult.data[0].id;

    // 1. Remove all existing members
    const deleteMembersResult = await dbExecute(
      `DELETE FROM organization_member WHERE organization = $1`,
      [orgId]
    );

    if (deleteMembersResult.error) {
      return err(`Failed to remove members: ${deleteMembersResult.error}`);
    }

    // 2. Update organization owner to target user
    const updateOwnerResult = await dbExecute(
      `UPDATE organization SET owner = $1 WHERE id = $2`,
      [targetUserId, orgId]
    );

    if (updateOwnerResult.error) {
      return err(`Failed to update owner: ${updateOwnerResult.error}`);
    }

    // 3. Add target user as the only member with owner role
    const addOwnerResult = await dbExecute(
      `INSERT INTO organization_member (organization, member, org_role) VALUES ($1, $2, $3)`,
      [orgId, targetUserId, "owner"]
    );

    if (addOwnerResult.error) {
      return err(`Failed to add new owner: ${addOwnerResult.error}`);
    }

    return ok(null);
  }

  @Get("/org-usage-light/{orgId}")
  public async getOrgUsageLight(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<{
    last_request_at: string | null;
    requests_last_30_days: number;
  }> {
    await authCheckThrow(request.authParams.userId);

    // Lightweight query - only fetch last request time and 30-day count
    const usageQuery = `
      SELECT
        max(request_created_at) as last_request_at,
        countIf(request_created_at >= now() - INTERVAL 30 DAY) as requests_last_30_days
      FROM request_response_rmt
      WHERE organization_id = {val_0:String}
    `;

    const usageResult = await clickhouseDb.dbQuery<{
      last_request_at: string | null;
      requests_last_30_days: string;
    }>(usageQuery, [orgId]);

    const usage = usageResult.data?.[0] ?? {
      last_request_at: null,
      requests_last_30_days: "0",
    };

    return {
      last_request_at: usage.last_request_at,
      requests_last_30_days: Number(usage.requests_last_30_days),
    };
  }

  @Get("/org-usage/{orgId}")
  public async getOrgUsage(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ): Promise<{
    total_requests: number;
    requests_last_30_days: number;
    monthly_usage: {
      month: string;
      requestCount: number;
      cost: number;
    }[];
    all_time_count: number;
  }> {
    await authCheckThrow(request.authParams.userId);

    // Fetch usage data from ClickHouse for a single org
    const usageQuery = `
      SELECT
        count(*) as total_requests,
        countIf(request_created_at >= now() - INTERVAL 30 DAY) as requests_last_30_days
      FROM request_response_rmt
      WHERE organization_id = {val_0:String}
    `;

    const monthlyUsageQuery = `
      SELECT
        toStartOfMonth(request_created_at) AS month,
        COUNT(*) AS requestCount,
        SUM(cost) / 1000000000 AS cost
      FROM
        request_response_rmt
      WHERE
        request_created_at > now() - INTERVAL 12 MONTH
        AND organization_id = {val_0:String}
      GROUP BY
        toStartOfMonth(request_created_at)
      ORDER BY
        month DESC
    `;

    const allTimeCountQuery = `
      SELECT count(*) as all_time_count
      FROM request_response_rmt
      WHERE organization_id = {val_0:String}
    `;

    const [usageResult, monthlyUsageResult, allTimeCountResult] =
      await Promise.all([
        clickhouseDb.dbQuery<{
          total_requests: string;
          requests_last_30_days: string;
        }>(usageQuery, [orgId]),
        clickhouseDb.dbQuery<{
          month: string;
          requestCount: string;
          cost: string;
        }>(monthlyUsageQuery, [orgId]),
        clickhouseDb.dbQuery<{
          all_time_count: string;
        }>(allTimeCountQuery, [orgId]),
      ]);

    const usage = usageResult.data?.[0] ?? {
      total_requests: "0",
      requests_last_30_days: "0",
    };

    const monthlyUsage = monthlyUsageResult.data ?? [];
    const allTimeCount = allTimeCountResult.data?.[0]?.all_time_count ?? "0";

    return {
      total_requests: Number(usage.total_requests),
      requests_last_30_days: Number(usage.requests_last_30_days),
      monthly_usage: monthlyUsage.map((item) => ({
        month: item.month,
        requestCount: Number(item.requestCount),
        cost: Number(item.cost),
      })),
      all_time_count: Number(allTimeCount),
    };
  }

  @Get("/settings/{name}")
  public async getSetting(
    @Path() name: SettingName,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Setting> {
    await authCheckThrow(request.authParams.userId);

    const { data, error } = await dbExecute<{
      settings: Setting;
    }>(
      `
      SELECT settings FROM helicone_settings WHERE name = $1
      `,
      [name]
    );

    if (error || !data) {
      throw new Error(error ?? "No settings found");
    }
    const settings = data?.[0]?.settings;

    return JSON.parse(JSON.stringify(settings)) as Setting;
  }

  @Get("/settings")
  public async getSettings(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<
    {
      name: string;
      settings: any;
    }[]
  > {
    await authCheckThrow(request.authParams.userId);

    const settings = await dbExecute<{
      name: string;
      settings: Setting;
    }>(
      `
      SELECT name, settings FROM helicone_settings
      `,
      []
    );

    return (
      settings.data?.map((setting) => ({
        name: setting.name,
        settings: JSON.parse(JSON.stringify(setting.settings)) as Setting,
      })) ?? []
    );
  }

  @Post("/settings")
  public async upsertSetting(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      name: string;
      settings: any;
    }
  ): Promise<void> {
    await authCheckThrow(request.authParams.userId);

    const { error } = await dbExecute(
      `
      INSERT INTO helicone_settings (name, settings) VALUES ($1, $2)
      ON CONFLICT (name) DO UPDATE SET settings = $2
      `,
      [body.name, JSON.stringify(body.settings)]
    );

    if (error) {
      throw new Error(error);
    }
  }

  @Post("/azure/run-test")
  public async azureTest(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      requestBody: any;
    }
  ) {
    await authCheckThrow(request.authParams.userId);

    const azureFetch = await prepareRequestAzure();

    const azureResult = await fetch(azureFetch.url, {
      method: "POST",
      headers: azureFetch.headers,
      body: JSON.stringify(body.requestBody),
    });
    const resultText = await azureResult.text();

    return {
      resultText: resultText,
      fetchParams: {
        url: azureFetch.url,
        headers: azureFetch.headers,
        body: JSON.stringify(body.requestBody),
      },
    };
  }

  @Post("/orgs/query")
  public async findAllOrgs(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      orgName: string;
    }
  ): Promise<{
    orgs: {
      name: string;
      id: string;
    }[];
  }> {
    await authCheckThrow(request.authParams.userId);

    const { data } = await dbExecute<{
      name: string;
      id: string;
    }>(
      `
      SELECT name, id FROM organization WHERE name ILIKE $1
      `,
      [body.orgName]
    );
    return {
      orgs:
        data?.map((org) => ({
          name: org.name,
          id: org.id,
        })) ?? [],
    };
  }

  @Post("/orgs/over-time/query")
  public async newOrgsOverTime(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      timeFilter:
        | "1 days"
        | "7 days"
        | "1 month"
        | "3 months"
        | "6 months"
        | "12 months"
        | "24 months";
      groupBy: "hour" | "day" | "week" | "month";
    }
  ): Promise<{
    newOrgsOvertime: {
      count: string;
      day: string;
    }[];
    newUsersOvertime: {
      count: string;
      day: string;
    }[];
    usersOverTime: {
      count: string;
      day: string;
    }[];
  }> {
    await authCheckThrow(request.authParams.userId);

    const orgData = await dbExecute<{
      count: string;
      day: string;
    }>(
      `
      SELECT
        count(*) as count,
        date_trunc('${body.groupBy}', o.created_at) AS day
      FROM organization o
      INNER JOIN auth.users u ON o.owner = u.id
      WHERE
        o.created_at > now() - INTERVAL '${body.timeFilter}'
        AND u.email NOT LIKE '%helicone.ai%'
        AND o.tier != 'demo'
      GROUP BY day
      ORDER BY day ASC

    `,
      []
    );

    const userData = await dbExecute<{
      count: string;
      day: string;
    }>(
      `
      SELECT
        count(*) as count,
        date_trunc('${body.groupBy}', created_at) AS day
      FROM auth.users
      WHERE
        created_at > now() - INTERVAL '${body.timeFilter}'
        AND email NOT LIKE '%helicone.ai%'
      GROUP BY day
      ORDER BY day ASC
    `,
      []
    );

    const countBeforeTimeFilter = await dbExecute<{
      count: string;
    }>(
      `
      SELECT count(*) as count FROM auth.users
      WHERE created_at < now() - INTERVAL '${body.timeFilter}'
      `,
      []
    );

    const userOverTime = await dbExecute<{
      count: string;
      day: string;
    }>(
      `
      WITH user_counts AS (
        SELECT
          date_trunc('${body.groupBy}', created_at) AS day,
          count(*) as new_users
        FROM auth.users
        WHERE created_at > now() - INTERVAL '${body.timeFilter}'
        GROUP BY day
      )
      SELECT
        day,
        sum(new_users) OVER (ORDER BY day) as count
      FROM user_counts
      ORDER BY day ASC
    `,
      []
    );

    return {
      newOrgsOvertime: orgData.data ?? [],
      newUsersOvertime: userData.data ?? [],
      usersOverTime:
        userOverTime.data?.map((data) => ({
          count: (
            +data.count + +countBeforeTimeFilter.data![0].count
          ).toString(),
          day: data.day,
        })) ?? [],
    };
  }

  @Post("/admins/org/query")
  public async addAdminsToOrg(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      orgId: string;
      adminIds: string[];
    }
  ): Promise<void> {
    await authCheckThrow(request.authParams.userId);
    const { orgId, adminIds } = body;

    for (const adminId of adminIds) {
      const { error } = await dbExecute(
        `
      INSERT INTO organization_member (organization, member, org_role) VALUES ($1, $2, $3)
      `,
        [orgId, adminId, "admin"]
      );

      if (error) {
        throw new Error(error);
      }
    }
  }

  @Post("/alert_banners")
  public async createAlertBanner(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      title: string;
      message: string;
    }
  ): Promise<void> {
    await authCheckThrow(request.authParams.userId);

    const { error } = await dbExecute(
      `
      INSERT INTO alert_banners (title, message, active) VALUES ($1, $2, $3)
      `,
      [body.title, body.message, false]
    );

    if (error) {
      throw new Error(error);
    }
  }

  @Patch("/alert_banners")
  public async updateAlertBanner(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      id: number;
      active: boolean;
    }
  ): Promise<void> {
    await authCheckThrow(request.authParams.userId);

    const { data } = await dbExecute<{
      title: string;
      message: string;
      active: boolean;
    }>(
      `
      SELECT * FROM alert_banners ORDER BY created_at DESC
      `,
      []
    );

    if (body.active) {
      const activeBanner = data?.find((banner) => banner.active);
      if (activeBanner) {
        throw new Error(
          "There is already an active banner. Please deactivate it first"
        );
      }
    }

    const { error } = await dbExecute(
      `
      UPDATE alert_banners SET active = $1, updated_at = $2 WHERE id = $3
      `,
      [body.active, new Date().toISOString(), body.id]
    );

    if (error) {
      throw new Error(error);
    }
  }

  @Post("/top-orgs-over-time")
  public async getTopOrgsOverTime(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      timeRange: string;
      limit: number;
      groupBy?: string;
    }
  ): Promise<{
    organizations: Array<{
      organization_id: string;
      organization_name: string;
      data: Array<{
        time: string;
        request_count: number;
      }>;
    }>;
  }> {
    await authCheckThrow(request.authParams.userId);

    // Parse time range from string to interval
    const parseTimeRange = (rangeStr: string): string => {
      // Maps from UI friendly names to ClickHouse interval strings
      switch (rangeStr) {
        case "10 minutes":
          return "10 minute";
        case "30 minutes":
          return "30 minute";
        case "1 hour":
          return "1 hour";
        case "3 hours":
          return "3 hour";
        case "12 hours":
          return "12 hour";
        case "1 day":
          return "1 day";
        case "3 days":
          return "3 day";
        case "7 days":
          return "7 day";
        case "14 days":
          return "14 day";
        case "30 days":
          return "30 day";
        default:
          return "1 day";
      }
    };

    const timeRangeInterval = parseTimeRange(body.timeRange || "1 day");
    const limit = body.limit || 10;
    let groupBy = body.groupBy;

    // Automatically set appropriate groupBy based on timeRange if not provided
    if (!groupBy) {
      if (
        timeRangeInterval === "10 minute" ||
        timeRangeInterval === "30 minute" ||
        timeRangeInterval === "1 hour"
      ) {
        groupBy = "minute";
      } else if (
        timeRangeInterval === "3 hour" ||
        timeRangeInterval === "12 hour" ||
        timeRangeInterval === "1 day"
      ) {
        groupBy = "10 minute";
      } else if (
        timeRangeInterval === "3 day" ||
        timeRangeInterval === "7 day"
      ) {
        groupBy = "hour";
      } else if (timeRangeInterval === "14 day") {
        groupBy = "6 hour";
      } else {
        groupBy = "day";
      }
    }

    // Function to get appropriate ClickHouse time function based on groupBy
    const getClickhouseTimeFunction = (groupBy: string) => {
      switch (groupBy) {
        case "minute":
          return "toStartOfMinute";
        case "10 minute":
          return `toStartOfInterval(request_created_at, INTERVAL 10 minute)`;
        case "hour":
          return "toStartOfHour";
        case "6 hour":
          return `toStartOfInterval(request_created_at, INTERVAL 6 hour)`;
        case "day":
          return "toStartOfDay";
        case "week":
          return "toStartOfWeek";
        default:
          return "toStartOfHour";
      }
    };

    // Get the appropriate time function for the SQL query
    const timeFunction = getClickhouseTimeFunction(groupBy);

    // Step 1: Get the top organizations by total request count
    const topOrgsQuery = `
      SELECT
          organization_id,
          COUNT(request_id) as request_count
      FROM
          request_response_rmt
      WHERE
          request_created_at > now() - interval '${timeRangeInterval}'
          AND request_created_at < now()
      GROUP BY
          organization_id
      ORDER BY
          request_count DESC
      LIMIT {val_0:UInt32}
    `;

    const topOrgsResult = await clickhouseDb.dbQuery<{
      organization_id: string;
      request_count: string;
    }>(topOrgsQuery, [limit]);

    if (!topOrgsResult.data || topOrgsResult.data.length === 0) {
      return { organizations: [] };
    }

    const orgIds = topOrgsResult.data.map((org) => org.organization_id);

    // Step 2: Fetch organization names
    const orgNamesQuery = `
      SELECT id, name FROM organization WHERE id = ANY($1::uuid[])
    `;

    const orgNamesResult = await dbExecute<{
      id: string;
      name: string;
    }>(orgNamesQuery, [orgIds]);

    const orgNameMap = new Map<string, string>();
    if (orgNamesResult.data) {
      orgNamesResult.data.forEach((org) => {
        orgNameMap.set(org.id, org.name);
      });
    }

    // Step 3: Get time series data for each organization with the appropriate grouping
    // Build IN clause with individual parameters
    const orgIdsParams = orgIds.map((_, index) => `{val_${index}:String}`).join(", ");

    const timeSeriesQuery =
      groupBy === "10 minute" || groupBy === "6 hour"
        ? `
        SELECT
            organization_id,
            COUNT(request_id) as request_count,
            toString(${timeFunction}) as time
        FROM
            request_response_rmt
        WHERE
            request_created_at > now() - interval '${timeRangeInterval}'
            AND organization_id IN (${orgIdsParams})
        GROUP BY
            organization_id,
            time
        ORDER BY
            organization_id,
            time
      `
        : `
        SELECT
            organization_id,
            COUNT(request_id) as request_count,
            toString(${timeFunction}(request_created_at)) as time
        FROM
            request_response_rmt
        WHERE
            request_created_at > now() - interval '${timeRangeInterval}'
            AND organization_id IN (${orgIdsParams})
        GROUP BY
            organization_id,
            time
        ORDER BY
            organization_id,
            time
      `;

    const timeSeriesResult = await clickhouseDb.dbQuery<{
      organization_id: string;
      request_count: string;
      time: string;
    }>(timeSeriesQuery, orgIds);

    if (!timeSeriesResult.data) {
      return { organizations: [] };
    }

    // Step 4: Combine the data
    const organizations = orgIds.map((orgId) => {
      const orgData = timeSeriesResult
        .data!.filter((point) => point.organization_id === orgId)
        .map((point) => ({
          time: point.time,
          request_count: parseInt(point.request_count, 10),
        }));

      return {
        organization_id: orgId,
        organization_name: orgNameMap.get(orgId) || orgId,
        data: orgData,
      };
    });

    return { organizations };
  }

  /**
   * Get all subscription data, invoices, and discounts for the admin projections page
   * Uses caching to minimize API calls to Stripe
   */
  @Get("/subscription-data")
  public async getSubscriptionData(
    @Request() request: JawnAuthenticatedRequest,
    @Query() forceRefresh?: boolean
  ): Promise<{
    subscriptions: Stripe.Subscription[];
    invoices: Stripe.Invoice[];
    discounts: Record<string, Stripe.Discount>;
    upcomingInvoices: Stripe.UpcomingInvoice[];
  }> {
    await authCheckThrow(request.authParams.userId);

    // Use AdminManager to handle Stripe API calls with rate limiting and caching
    const adminManager = new AdminManager(request.authParams);
    const result = await adminManager.getSubscriptionData(forceRefresh);

    if (result.error || !result.data) {
      throw new Error(result.error || "No subscription data returned");
    }

    // Return the data
    return result.data;
  }

  @Post("/backfill-costs-preview")
  public async backfillCostsPreview(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      models: ModelWithProvider[];
      hasCosts: boolean;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<{
    query: string;
    results: Array<{
      model: string;
      provider: string;
      count: string;
    }>;
    totalCount: number;
  }> {
    await authCheckThrow(request.authParams.userId);

    const params: (string | number | boolean | Date)[] = [];
    let paramIndex = 0;

    let dateCondition = "";
    if (body.toDate) {
      dateCondition = `response_created_at <= {val_${paramIndex}:DateTime64(3)}`;
      params.push(body.toDate);
      paramIndex++;
    } else {
      dateCondition = "response_created_at <= now()";
    }

    if (body.fromDate) {
      dateCondition += ` AND response_created_at >= {val_${paramIndex}:DateTime64(3)}`;
      params.push(body.fromDate);
      paramIndex++;
    }

    const query = `
    SELECT model, provider, count(*) AS count from request_response_rmt
    WHERE (
      ${dateCondition}
      AND ${clickhouseModelFilter(body.models)}
      AND ${body.hasCosts ? "cost > 0" : "cost = 0"} AND (prompt_tokens > 0 OR completion_tokens > 0)
    )
    GROUP BY model, provider
    ORDER BY count DESC`;

    const result = await clickhouseDb.dbQuery<{
      model: string;
      provider: string;
      count: string;
    }>(query, params);

    if (result.error) {
      throw new Error(result.error);
    }

    const results = result.data || [];
    const totalCount = results.reduce(
      (sum, row) => sum + parseInt(row.count),
      0
    );

    return {
      query,
      results,
      totalCount,
    };
  }

  @Post("/deduplicate-request-response-rmt")
  public async deduplicateRequestResponseRmt(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {}
  ): Promise<{
    query: string;
    message: string;
  }> {
    await authCheckThrow(request.authParams.userId);
    const query = `OPTIMIZE TABLE request_response_rmt DEDUPLICATE`;

    const result = await clickhouseDb.dbQuery<{}>(query, []);
    if (result.error) {
      throw new Error(result.error);
    }

    return {
      query,
      message:
        "Deduplication completed successfully. This operation may take some time to fully process.",
    };
  }

  /**
   * Backfill costs in Clickhouse with updated cost package data.
   */
  @Post("/backfill-costs")
  public async backfillCosts(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      models: ModelWithProvider[];
      confirmed: boolean;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<{
    query: string;
  }> {
    await authCheckThrow(request.authParams.userId);

    const params: (string | number | boolean | Date)[] = [];
    let paramIndex = 0;

    let dateCondition = "";
    if (body.toDate) {
      dateCondition = `response_created_at <= {val_${paramIndex}:DateTime64(3)}`;
      params.push(body.toDate);
      paramIndex++;
    } else {
      dateCondition = "response_created_at <= now()";
    }

    if (body.fromDate) {
      dateCondition += ` AND response_created_at >= {val_${paramIndex}:DateTime64(3)}`;
      params.push(body.fromDate);
      paramIndex++;
    }

    const query = `
    INSERT INTO request_response_rmt
    SELECT
      response_id,
      response_created_at,
      latency,
      status,
      completion_tokens,
      completion_audio_tokens,
      cache_reference_id,
      prompt_tokens,
      prompt_cache_write_tokens,
      prompt_cache_read_tokens,
      prompt_audio_tokens,
      model,
      request_id,
      request_created_at,
      user_id,
      organization_id,
      proxy_key_id,
      threat,
      time_to_first_token,
      provider,
      target_url,
      country_code,
      cache_enabled,
      properties,
      scores,
      request_body,
      response_body,
      ${clickhousePriceCalcNonAggregated(body.models)} as cost,
      prompt_id,
      prompt_version,
      assets,
      now() as updated_at
    FROM request_response_rmt
    WHERE (
      ${dateCondition}
      AND ${clickhouseModelFilter(body.models)}
    )
    `;

    if (!body.confirmed) {
      return { query };
    }

    const result = await clickhouseDb.dbQuery<{}>(query, params);
    if (result.error) {
      throw new Error(result.error);
    }

    return { query };
  }

  @Get("/helix-thread/{sessionId}")
  public async getHelixThread(
    @Request() request: JawnAuthenticatedRequest,
    @Path() sessionId: string
  ): Promise<Result<InAppThread, string>> {
    await authCheckThrow(request.authParams.userId);
    const thread = await dbExecute<InAppThread>(
      `SELECT * FROM in_app_threads WHERE id = $1`,
      [sessionId]
    );
    if (thread.error) {
      return err(thread.error);
    }
    if (!thread.data?.[0]) {
      return err("Thread not found");
    }
    return ok(thread.data?.[0]);
  }

  @Post("/hql-enriched")
  public async executeEnrichedHql(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      sql: string;
      limit?: number;
    }
  ): Promise<
    Result<
      {
        rows: Record<string, any>[];
        elapsedMilliseconds: number;
        size: number;
        rowCount: number;
      },
      string
    >
  > {
    await authCheckThrow(request.authParams.userId);

    const limit = body.limit ?? 100;

    // Execute HQL query using HeliconeSqlManager
    // Note: We use a dummy org ID since this is admin-only and bypasses org filtering
    const heliconeSqlManager = new HeliconeSqlManager({
      organizationId: ADMIN_ORG_ID,
      userId: request.authParams.userId,
    });

    const hqlResult = await heliconeSqlManager.executeAdminSql(body.sql, limit);

    if (hqlResult.error) {
      return err(hqlResult.error.message || String(hqlResult.error));
    }

    if (!hqlResult.data) {
      return err("No data returned from query");
    }

    const { rows, elapsedMilliseconds, size, rowCount } = hqlResult.data;

    // Extract unique organization IDs from results
    const orgIds = [
      ...new Set(
        rows
          .map((row) => row.organization_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      ),
    ];

    // If no organization IDs found, return results as-is
    if (orgIds.length === 0) {
      return ok({
        rows,
        elapsedMilliseconds,
        size,
        rowCount,
      });
    }

    // Fetch organization details from PostgreSQL
    const orgQuery = `
      SELECT
        o.id,
        o.name,
        o.tier,
        o.stripe_customer_id,
        u.email as owner_email
      FROM organization o
      LEFT JOIN auth.users u ON o.owner = u.id
      WHERE o.id = ANY($1::uuid[])
    `;

    const orgResult = await dbExecute<{
      id: string;
      name: string;
      tier: string;
      stripe_customer_id: string | null;
      owner_email: string;
    }>(orgQuery, [orgIds]);

    if (orgResult.error) {
      console.error("Error fetching org details:", orgResult.error);
      // Return original results if enrichment fails
      return ok({
        rows,
        elapsedMilliseconds,
        size,
        rowCount,
      });
    }

    // Create a map for fast lookup
    const orgDetailsMap = new Map(
      orgResult.data?.map((org) => [org.id, org]) ?? []
    );

    // Enrich rows with organization details
    const enrichedRows = rows.map((row) => {
      const orgId = row.organization_id;
      if (!orgId || typeof orgId !== "string") {
        return row;
      }

      const orgDetails = orgDetailsMap.get(orgId);
      if (!orgDetails) {
        return row;
      }

      return {
        org_name: orgDetails.name,
        owner_email: orgDetails.owner_email,
        tier: orgDetails.tier,
        stripe_customer_id: orgDetails.stripe_customer_id,
        ...row,
      };
    });

    return ok({
      rows: enrichedRows,
      elapsedMilliseconds,
      size,
      rowCount,
    });
  }

  /**
   * Get all saved queries for admin (stored under admin org ID)
   */
  @Get("/saved-queries")
  public async getAdminSavedQueries(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<HqlSavedQuery[], string>> {
    await authCheckThrow(request.authParams.userId);

    const hqlQueryManager = new HqlQueryManager({
      ...request.authParams,
      organizationId: ADMIN_ORG_ID,
    });

    const result = await hqlQueryManager.getSavedQueries();
    if (result.error) {
      return err(result.error.message || String(result.error));
    }
    return ok(result.data);
  }

  /**
   * Create a new saved query for admin (stored under admin org ID)
   */
  @Post("/saved-query")
  public async createAdminSavedQuery(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: { name: string; sql: string }
  ): Promise<Result<HqlSavedQuery[], string>> {
    await authCheckThrow(request.authParams.userId);

    const hqlQueryManager = new HqlQueryManager({
      ...request.authParams,
      organizationId: ADMIN_ORG_ID,
    });

    const result = await hqlQueryManager.createSavedQuery(body);
    if (result.error) {
      return err(result.error.message || String(result.error));
    }
    return ok(result.data);
  }

  /**
   * Update a saved query for admin (stored under admin org ID)
   */
  @Patch("/saved-query/{queryId}")
  public async updateAdminSavedQuery(
    @Request() request: JawnAuthenticatedRequest,
    @Path() queryId: string,
    @Body() body: { name: string; sql: string }
  ): Promise<Result<HqlSavedQuery, string>> {
    await authCheckThrow(request.authParams.userId);

    const hqlQueryManager = new HqlQueryManager({
      ...request.authParams,
      organizationId: ADMIN_ORG_ID,
    });

    const result = await hqlQueryManager.updateSavedQuery({
      id: queryId,
      ...body,
    });
    if (result.error) {
      return err(result.error.message || String(result.error));
    }
    return ok(result.data);
  }

  /**
   * Delete a saved query for admin (stored under admin org ID)
   */
  @Delete("/saved-query/{queryId}")
  public async deleteAdminSavedQuery(
    @Request() request: JawnAuthenticatedRequest,
    @Path() queryId: string
  ): Promise<Result<null, string>> {
    await authCheckThrow(request.authParams.userId);

    const hqlQueryManager = new HqlQueryManager({
      ...request.authParams,
      organizationId: ADMIN_ORG_ID,
    });

    const result = await hqlQueryManager.deleteSavedQuery(queryId);
    if (result.error) {
      return err(result.error.message || String(result.error));
    }
    return ok(null);
  }
}
