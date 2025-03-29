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
} from "tsoa";
import { clickhouseDb } from "../../lib/db/ClickhouseWrapper";
import { prepareRequestAzure } from "../../lib/experiment/requestPrep/azure";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { JawnAuthenticatedRequest } from "../../types/request";
import { Setting, SettingName } from "../../utils/settings";

export const authCheckThrow = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Replace Supabase call with dbExecute
  const result = await dbExecute<{ user_id: string }>(
    "SELECT user_id FROM admins WHERE user_id = $1",
    [userId]
  );

  if (result.error) {
    throw new Error(result.error);
  }

  const hasAdmin = result.data?.map((admin) => admin.user_id).includes(userId);

  if (!hasAdmin) {
    throw new Error("Unauthorized");
  }
};

@Route("v1/admin")
@Tags("Admin")
@Security("api_key")
export class AdminController extends Controller {
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
            'last_sign_in_at', u.last_sign_in_at
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
        WHERE organization_id = '${orgId}'
      `;

      const monthlyUsageQuery = `
        SELECT
          toStartOfMonth(request_created_at) AS month,
          COUNT(*) AS requestCount
        FROM
          request_response_rmt
        WHERE
          request_created_at > now() - INTERVAL 3 MONTH
          AND organization_id = '${orgId}'
        GROUP BY
          toStartOfMonth(request_created_at)
        ORDER BY
          month DESC
      `;

      const allTimeCountQuery = `
        SELECT count(*) as all_time_count
        FROM request_response_rmt
        WHERE organization_id = '${orgId}'
      `;

      const [usageResult, monthlyUsageResult, allTimeCountResult] =
        await Promise.all([
          clickhouseDb.dbQuery<{
            total_requests: string;
            requests_last_30_days: string;
          }>(usageQuery, []),
          clickhouseDb.dbQuery<{
            month: string;
            requestCount: string;
          }>(monthlyUsageQuery, []),
          clickhouseDb.dbQuery<{
            all_time_count: string;
          }>(allTimeCountQuery, []),
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
      ${body.tier !== "all" ? `AND organization.tier = '${body.tier}'` : ""}
    )
    GROUP BY
      organization.id,
      organization.tier,
      users_view.email,
      users_view.last_sign_in_at;
    `,
      []
    );

    if (!orgData.data) {
      return [];
    }

    // Step 1: Fetch top organizations
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
      request_response_rmt.request_created_at > toDateTime('${body.startDate}')
      and request_response_rmt.request_created_at < toDateTime('${
        body.endDate
      }')
    AND organization_id in (
      ${orgData.data
        ?.map((org) => `'${org.id}'`)
        .slice(0, 30)
        .join(",")}
    )
    GROUP BY organization_id
    ORDER BY ct DESC
    `,
      []
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
      where request_response_rmt.organization_id in (
        ${orgs.data
          ?.map((org) => `'${org.organization_id}'`)
          .slice(0, 30)
          .join(",")}
      )
      and request_response_rmt.request_created_at > toDateTime('${
        body.startDate
      }')
      and request_response_rmt.request_created_at < toDateTime('${
        body.endDate
      }')
      group by dt, organization_id
      order by organization_id, dt ASC
      -- WITH FILL FROM toStartOfHour(now() - INTERVAL '30 day') TO toStartOfHour(now()) + 1 STEP INTERVAL 1 HOUR
      WITH FILL FROM toDateTime('${body.startDate}') TO toDateTime('${
        body.endDate
      }') STEP INTERVAL 1 ${timeGrain}
    `,
      []
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
      SELECT user_email, id, created_ai, user_id FROM
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
            'last_sign_in_at', u.last_sign_in_at
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
        WHERE organization_id = '${org.id}'
      `;

        const monthlyUsageQuery = `
        SELECT
          toStartOfMonth(request_created_at) AS month,
          COUNT(*) AS requestCount
        FROM
          request_response_rmt
        WHERE
          request_created_at > now() - INTERVAL 12 MONTH
          AND organization_id = '${org.id}'
        GROUP BY
          toStartOfMonth(request_created_at)
        ORDER BY
          month DESC
      `;

        const allTimeCountQuery = `
        SELECT count(*) as all_time_count
        FROM request_response_rmt
        WHERE organization_id = '${org.id}'
      `;

        const [usageResult, monthlyUsageResult, allTimeCountResult] =
          await Promise.all([
            clickhouseDb.dbQuery<{
              total_requests: string;
              requests_last_30_days: string;
            }>(usageQuery, []),
            clickhouseDb.dbQuery<{
              month: string;
              requestCount: string;
            }>(monthlyUsageQuery, []),
            clickhouseDb.dbQuery<{
              all_time_count: string;
            }>(allTimeCountQuery, []),
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

  @Post("/settings")
  public async updateSetting(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      name: SettingName;
      settings: Setting;
    }
  ): Promise<void> {
    await authCheckThrow(request.authParams.userId);

    const { data: currentSettings } = await dbExecute<{
      settings: Setting;
    }>(
      `
      SELECT settings FROM helicone_settings WHERE name = $1
      `,
      [body.name]
    );

    if (!currentSettings) {
      await dbExecute(
        `
        INSERT INTO helicone_settings (name, settings) VALUES ($1, $2)
        `,
        [body.name, JSON.parse(JSON.stringify(body.settings))]
      );
    } else {
      await dbExecute(
        `
        UPDATE helicone_settings SET settings = $1 WHERE name = $2
        `,
        [JSON.parse(JSON.stringify(body.settings)), body.name]
      );
    }

    return;
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

    const { error } = await dbExecute(
      `
      INSERT INTO organization_member (organization, member, org_role) VALUES ($1, $2, $3)
      `,
      [orgId, adminIds, "admin"]
    );

    if (error) {
      throw new Error(error);
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

    // Step 2: Fetch organization names
    const orgNamesQuery = `
      SELECT id, name FROM organization WHERE id IN (${orgIds
        .map((id) => `'${id}'`)
        .join(",")})
    `;

    const orgNamesResult = await dbExecute<{
      id: string;
      name: string;
    }>(orgNamesQuery, []);

    const orgNameMap = new Map<string, string>();
    if (orgNamesResult.data) {
      orgNamesResult.data.forEach((org) => {
        orgNameMap.set(org.id, org.name);
      });
    }

    // Step 3: Get time series data for each organization with the appropriate grouping
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
            AND organization_id IN (${orgIds.map((id) => `'${id}'`).join(",")})
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
            AND organization_id IN (${orgIds.map((id) => `'${id}'`).join(",")})
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
    }>(timeSeriesQuery, []);

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
}
