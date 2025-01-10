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
import { supabaseServer } from "../../lib/db/supabase";
import { prepareRequestAzure } from "../../lib/experiment/requestPrep/azure";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { getGovernanceOrgs } from "../../lib/stores/AdminStore";
import { JawnAuthenticatedRequest } from "../../types/request";
import { Setting, SettingName } from "../../utils/settings";

export const authCheckThrow = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const { data, error } = await supabaseServer.client
    .from("admins")
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  const hasAdmin = data?.map((admin) => admin.user_id).includes(userId);

  if (!hasAdmin) {
    throw new Error("Unauthorized");
  }
};

@Route("v1/admin")
@Tags("Admin")
@Security("api_key")
export class AdminController extends Controller {
  @Get("governance-orgs/keys")
  public async getGovernanceOrgKeys(
    @Request() request: JawnAuthenticatedRequest
  ) {
    await authCheckThrow(request.authParams.userId);

    return await supabaseServer.client
      .from("helicone_settings")
      .select("*")
      .eq("name", "governance_keys")
      .single();
  }

  @Post("/governance-orgs/keys")
  public async createGovernanceOrgKey(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      name: string;
      value: string;
    }
  ) {
    await authCheckThrow(request.authParams.userId);

    let keys: { name: string; value: string }[] = [];
    const keysData = await supabaseServer.client
      .from("helicone_settings")
      .select("*")
      .eq("name", "governance_keys");

    if (keysData.error) {
      this.setStatus(404);
      throw new Error("Keys not found");
    }

    if (keysData.data?.[0]) {
      keys = (keysData.data[0].settings as any).keys.filter(
        (key: { name: string }) => key.name !== body.name
      );
    }

    keys.push({
      name: body.name,
      value: body.value,
    });

    let seen = new Set();
    keys = keys.filter((key) => {
      if (seen.has(key.name)) {
        return false;
      }
      seen.add(key.name);
      return true;
    });

    const { data, error } = await supabaseServer.client
      .from("helicone_settings")
      .update({
        settings: {
          keys,
        },
      })
      .eq("name", "governance_keys");

    if (error) {
      this.setStatus(404);
      throw new Error("Keys not found");
    }

    return data;
  }

  @Delete("/governance-orgs/keys")
  public async deleteGovernanceOrgKey(
    @Request() request: JawnAuthenticatedRequest,
    @Body() body: { name: string }
  ) {
    await authCheckThrow(request.authParams.userId);

    const keysData = await supabaseServer.client
      .from("helicone_settings")
      .select("*")
      .eq("name", "governance_keys");

    if (keysData.error) {
      this.setStatus(404);
      throw new Error("Keys not found");
    }

    const keys = keysData.data?.[0];

    const newKeys = (keys?.settings as any).keys.filter(
      (key: { name: string }) => key.name !== body.name
    );

    const { data, error } = await supabaseServer.client
      .from("helicone_settings")
      .upsert({
        name: "governance_keys",
        settings: {
          keys: newKeys,
        },
      });

    if (error) {
      this.setStatus(404);
      throw new Error("Keys not found");
    }

    return data;
  }

  @Post("/governance-orgs/{orgId}")
  public async governanceOrgs(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string,
    @Body()
    body: {
      limitUSD: number | null;
      days: number | null;
    }
  ) {
    await authCheckThrow(request.authParams.userId);

    const org = await supabaseServer.client
      .from("organization")
      .update({
        governance_settings: {
          limitUSD: body.limitUSD,
          days: body.days,
        },
      })
      .eq("id", orgId);

    if (org.error) {
      this.setStatus(404);
      throw new Error("Organization not found");
    }

    return org.data;
  }

  @Delete("/governance-orgs/{orgId}")
  public async deleteGovernanceOrg(
    @Request() request: JawnAuthenticatedRequest,
    @Path() orgId: string
  ) {
    await authCheckThrow(request.authParams.userId);

    const org = await supabaseServer.client
      .from("organization")
      .update({
        governance_settings: null,
      })
      .eq("id", orgId);

    if (org.error) {
      this.setStatus(404);
      throw new Error("Organization not found");
    }

    return org.data;
  }

  @Get("/governance-orgs")
  @Tags("Governance Orgs")
  @Security("api_key")
  public async getGovernanceOrgs(@Request() request: JawnAuthenticatedRequest) {
    await authCheckThrow(request.authParams.userId);

    return await getGovernanceOrgs();
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
            'last_sign_in_at', u.last_sign_in_at
          )
        ) AS members
      FROM organization o
      LEFT JOIN organization_member om ON o.id = om.organization
      LEFT JOIN auth.users u ON om.member = u.id
      WHERE o.id = ANY($1)
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
    const { data, error } = await supabaseServer.client
      .from("admins")
      .select("*");

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

    // Fetch organization details
    let orgQuery = `
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
      WHERE 1=1
    `;

    const queryParams: any[] = [];

    if (organizationId) {
      orgQuery += ` AND o.id = $1`;
      queryParams.push(organizationId);
    } else if (userId) {
      orgQuery += ` AND om.member = $1`;
      queryParams.push(userId);
    } else if (email) {
      orgQuery += ` AND u.email = $1`;
      queryParams.push(email);
    }

    orgQuery += ` GROUP BY o.id`;

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

    const { data, error } = await supabaseServer.client
      .from("helicone_settings")
      .select("*")
      .eq("name", name);

    if (error || data.length === 0) {
      throw new Error(error?.message ?? "No settings found");
    }
    const settings = data[0].settings;

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

    const { data: currentSettings } = await supabaseServer.client
      .from("helicone_settings")
      .select("*")
      .eq("name", body.name);

    if (currentSettings!.length === 0) {
      const { error } = await supabaseServer.client
        .from("helicone_settings")
        .insert({
          name: body.name,
          settings: JSON.parse(JSON.stringify(body.settings)),
        });
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await supabaseServer.client
        .from("helicone_settings")
        .update({
          settings: JSON.parse(JSON.stringify(body.settings)),
        })
        .eq("name", body.name);
      if (error) {
        throw new Error(error.message);
      }
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

    const { data, error } = await supabaseServer.client
      .from("organization")
      .select("*")
      .ilike("name", `%${body.orgName}%`);
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

    const { data, error } = await supabaseServer.client
      .from("organization_member")
      .insert(
        adminIds.map((adminId) => ({
          organization: orgId,
          member: adminId,
          org_role: "admin",
        }))
      );

    if (error) {
      throw new Error(error.message);
    }

    return;
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

    const { data, error } = await supabaseServer.client
      .from("alert_banners")
      .insert({
        title: body.title,
        message: body.message,
        active: false,
      });

    if (error) {
      throw new Error(error.message);
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

    const { data, error } = await supabaseServer.client
      .from("alert_banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (body.active) {
      const activeBanner = data?.find((banner) => banner.active);
      if (activeBanner) {
        throw new Error(
          "There is already an active banner. Please deactivate it first"
        );
      }
    }

    const { data: updateData, error: updateError } = await supabaseServer.client
      .from("alert_banners")
      .update({
        active: body.active,
        updated_at: new Date().toISOString(),
      })
      .match({ id: body.id });

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}
