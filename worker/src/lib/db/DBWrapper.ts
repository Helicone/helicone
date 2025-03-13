import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env, hash } from "../..";
import { Database } from "../../../supabase/database.types";
import { getProviderKeyFromProxyCache } from "../RequestWrapper";
import { AuthParams } from "../dbLogger/DBLoggable";
import { SecureCacheEnv, getAndStoreInCache } from "../util/cache/secureCache";
import { Result, err, ok } from "../util/results";
import { RateLimiter } from "../clients/RequestRateLimiter";

export interface InternalAuthParams {
  organizationId: string;
  userId?: string;
  heliconeApiKeyId?: number;
}

async function getHeliconeApiKeyRow(
  dbClient: SupabaseClient<Database>,
  heliconeApi: string
): Promise<Result<InternalAuthParams, string>> {
  const { data, error } = await dbClient
    .from("helicone_api_keys")
    .select("*")
    .eq("api_key_hash", await hash(heliconeApi))
    .eq("soft_delete", false)
    .single();

  if (error !== null) {
    return { data: null, error: error.message };
  }
  return {
    data: {
      organizationId: data?.organization_id,
      userId: data?.user_id,
      heliconeApiKeyId: data?.id,
    },
    error: null,
  };
}
async function getHeliconeProxyKeyRow(
  dbClient: SupabaseClient<Database>,
  { token }: BearerAuthProxy,
  env: Env
): Promise<Result<InternalAuthParams, string>> {
  const { data, error } = await getProviderKeyFromProxyCache(
    token,
    env,
    dbClient
  );

  if (error || !data) {
    return err(error);
  }

  return ok({
    organizationId: data.organizationId,
    userId: undefined,
    heliconeApiKeyId: undefined,
  });
}

async function getHeliconeJwtAuthParams(
  dbClient: SupabaseClient<Database>,
  orgId: string,
  heliconeJwt: string
): Promise<Result<InternalAuthParams, string>> {
  const user = await dbClient.auth.getUser(heliconeJwt);
  if (user.error) {
    console.error("Error fetching user:", user.error.message);
    return { error: user.error.message, data: null };
  }

  const orgOwner = await dbClient
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .eq("owner", user.data.user.id);

  if (orgOwner.error) {
    console.error("Error fetching user:", orgOwner.error?.message);
    return { error: orgOwner.error?.message, data: null };
  }

  if (orgOwner.data.length > 0) {
    return {
      data: {
        organizationId: orgOwner.data[0].id,
        userId: user.data.user.id,
        heliconeApiKeyId: undefined,
      },
      error: null,
    };
  } else {
    const orgMember = await dbClient
      .from("organization_member")
      .select("*")
      .eq("member", user.data.user.id)
      .eq("organization", orgId)
      .single();

    if (orgMember.error) {
      console.error("Error fetching user:", orgMember.error.message);
      return { error: orgMember.error.message, data: null };
    }

    if (orgMember.data) {
      return {
        data: {
          organizationId: orgMember.data.organization,
          userId: user.data.user.id,
          heliconeApiKeyId: undefined,
        },
        error: null,
      };
    }

    return { data: null, error: "Invalid authentication." };
  }
}

export type JwtAuth = {
  _type: "jwt";
  token: string;
  orgId?: string;
};

export type BearerAuth = {
  _type: "bearer";
  token: string;
};

export type BearerAuthProxy = {
  _type: "bearerProxy";
  token: string;
};

export type HeliconeAuth = JwtAuth | BearerAuthProxy | BearerAuth;

export class DBWrapper {
  private supabaseClient: SupabaseClient<Database>;
  private secureCacheEnv: SecureCacheEnv;
  private atomicRateLimiter: DurableObjectNamespace;
  private rateLimiter?: RateLimiter;
  private authParams?: AuthParams;
  private tier?: string;

  constructor(private env: Env, private auth: HeliconeAuth) {
    this.supabaseClient = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.secureCacheEnv = {
      REQUEST_CACHE_KEY: env.REQUEST_CACHE_KEY,
      SECURE_CACHE: env.SECURE_CACHE,
    };
    this.atomicRateLimiter = env.RATE_LIMITER;
  }

  getClient(): SupabaseClient<Database> {
    return this.supabaseClient;
  }
  async getRateLimiter(): Promise<Result<RateLimiter, string>> {
    if (this.rateLimiter !== undefined) {
      return ok(this.rateLimiter);
    }
    const authParams = await this.getAuthParams();
    if (authParams.error !== null) {
      return err(authParams.error);
    }
    this.rateLimiter = new RateLimiter(this.atomicRateLimiter, authParams.data);

    return ok(this.rateLimiter);
  }

  private async _getAuthParamsInternal(): Promise<
    Result<InternalAuthParams, string>
  > {
    switch (this.auth._type) {
      case "jwt":
        if (!this.auth.orgId) {
          return err(
            "Helicone organization id is required for JWT authentication."
          );
        }
        return getHeliconeJwtAuthParams(
          this.supabaseClient,
          this.auth.orgId,
          this.auth.token
        );

      case "bearerProxy":
        return getHeliconeProxyKeyRow(this.supabaseClient, this.auth, this.env);
      case "bearer":
        return getHeliconeApiKeyRow(this.supabaseClient, this.auth.token);
    }
    throw new Error("Invalid authentication."); // this is unreachable
  }

  private async _getAuthParams(): Promise<Result<AuthParams, string>> {
    const internalAuthParams = await this._getAuthParamsInternal();
    if (internalAuthParams.error !== null) {
      return err(internalAuthParams.error);
    }

    const org = await this.supabaseClient
      .from("organization")
      .select("*")
      .eq("id", internalAuthParams.data.organizationId)
      .single();

    if (org.error !== null) {
      return err(org.error.message);
    }

    const tier = org.data.tier ?? "free";
    return ok({
      organizationId: internalAuthParams.data.organizationId,
      userId: internalAuthParams.data.userId,
      heliconeApiKeyId: internalAuthParams.data.heliconeApiKeyId,
      tier: org.data.tier ?? "free",
      accessDict: {
        cache:
          tier === "enterprise" ||
          tier === "pro" ||
          tier === "pro-20240913" ||
          tier === "pro-20250202" ||
          tier === "growth",
      },
    });
  }

  async getAuthParams(): Promise<Result<AuthParams, string>> {
    if (this.authParams !== undefined) {
      return ok(this.authParams);
    }
    const cacheKey = (await hash(JSON.stringify(this.auth))).substring(0, 32);
    const authParams = await getAndStoreInCache(
      `authParams3-${cacheKey}`,
      this.env,
      async () => await this._getAuthParams()
    );

    if (!authParams || authParams.error || !authParams.data) {
      return err(authParams?.error || "Invalid authentication.");
    }

    this.authParams = authParams.data;
    return authParams;
  }

  async getOrganization(): Promise<
    Result<
      {
        tier: string;
        id: string;
        percentLog: number;
      },
      string
    >
  > {
    const authParams = await this.getAuthParams();
    if (authParams.error !== null) {
      return err(authParams.error);
    }
    return await getAndStoreInCache<
      {
        tier: string;
        id: string;
        percentLog: number;
      },
      string
    >(
      `org-${authParams.data.organizationId}`,
      this.secureCacheEnv,
      async () => {
        const { data, error } = await this.supabaseClient
          .from("organization")
          .select("*")
          .eq("id", authParams.data.organizationId)
          .single();

        if (error !== null) {
          return err(error.message);
        }
        return ok({
          tier: data?.tier ?? "free",
          id: data?.id ?? "",
          percentLog: data?.percent_to_log ?? 100_000,
        });
      }
    );
  }

  async getTier(): Promise<Result<string, string>> {
    const org = await this.getOrganization();
    if (org.error !== null) {
      return err(org.error);
    }

    return ok(org.data.tier);
  }

  async isAuthorized(): Promise<boolean> {
    try {
      const params = await this.getAuthParams();
      if (params.error !== null || params.data.organizationId === undefined) {
        return false;
      }
    } catch (e) {
      return false;
    }
    return true;
  }

  async orgId(): Promise<string> {
    return (await this.getAuthParams()).data?.organizationId ?? "";
  }

  async getJobById(
    jobId: string
  ): Promise<Result<Database["public"]["Tables"]["job"]["Row"], string>> {
    const { data, error } = await this.supabaseClient
      .from("job")
      .select("*")
      .match({
        id: jobId,
      })
      .eq("org_id", await this.orgId())
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data, error: null };
  }

  async getNodeById(
    nodeId: string
  ): Promise<Result<Database["public"]["Tables"]["job_node"]["Row"], string>> {
    const { data, error } = await this.supabaseClient
      .from("job_node")
      .select("*")
      .match({
        id: nodeId,
      })
      .eq("org_id", await this.orgId())
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data, error: null };
  }

  async getRequestById(
    requestId: string
  ): Promise<Result<Database["public"]["Tables"]["request"]["Row"], string>> {
    const { data, error } = await this.supabaseClient
      .from("request")
      .select("*")
      .match({
        id: requestId,
      })
      .eq("helicone_org_id", await this.orgId())
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data, error: null };
  }

  async insertAlert(
    alert: Database["public"]["Tables"]["alert"]["Insert"]
  ): Promise<Result<Database["public"]["Tables"]["alert"]["Row"], string>> {
    const { data, error } = await this.supabaseClient
      .from("alert")
      .insert(alert)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data, error: null };
  }

  async deleteAlert(
    alertId: string,
    orgId: string
  ): Promise<Result<null, string>> {
    const { error } = await this.supabaseClient
      .from("alert")
      .update({ soft_delete: true })
      .eq("id", alertId)
      .eq("org_id", orgId);

    if (error) {
      return { error: error.message, data: null };
    }

    return { error: null, data: null };
  }

  async uploadLogo(
    logoFile: File,
    logoUrl: string,
    orgId: string
  ): Promise<Result<null, string>> {
    const { data, error } = await this.supabaseClient.storage
      .from("organization_assets")
      .upload(logoUrl, logoFile);

    if (error || !data) {
      return err(error.message);
    }

    const { error: updateError } = await this.supabaseClient
      .from("organization")
      .update({
        logo_path: data.path,
      })
      .eq("id", orgId);

    if (updateError) {
      return err(updateError.message);
    }

    return ok(null);
  }

  async getLogoPath(orgId: string): Promise<Result<string, string>> {
    const { data: organization, error: organizationErr } =
      await this.supabaseClient
        .from("organization")
        .select("*")
        .eq("id", orgId)
        .single();

    console.log(`organization: ${JSON.stringify(organization)}`);

    if (organizationErr || !organization) {
      return err(organizationErr?.message ?? "Failed to get organization.");
    }

    // If logo path is already set, return it
    if (organization.logo_path) {
      return ok(organization.logo_path);
    }

    if (!organization.reseller_id) {
      return err("Reseller id not found on organization.");
    }

    // Get logo path from reseller id
    const { data: resellerOrg, error: resellerOrgErr } =
      await this.supabaseClient
        .from("organization")
        .select("*")
        .eq("organization_id", organization.reseller_id)
        .single();

    if (resellerOrgErr || !resellerOrg?.logo_path) {
      return err(
        resellerOrgErr?.message ?? "Failed to get logo path from reseller id."
      );
    }

    return ok(resellerOrg.logo_path);
  }
}
