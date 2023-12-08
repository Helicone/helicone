import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Database, Json } from "../../supabase/database.types";
import { Env, hash } from "..";
import { AuthParams } from "../lib/dbLogger/DBLoggable";
import { Result, err, ok } from "../results";
import { SecureCacheEnv, getFromCache, storeInCache } from "../lib/secureCache";
import { RateLimiter } from "./RateLimiter";

async function getHeliconeApiKeyRow(
  dbClient: SupabaseClient<Database>,
  heliconeApiKeyHash?: string
): Promise<Result<AuthParams, string>> {
  if (!heliconeApiKeyHash) {
    return { data: null, error: "Helicone api key not found" };
  }

  const { data, error } = await dbClient
    .from("helicone_api_keys")
    .select("*")
    .eq("api_key_hash", heliconeApiKeyHash)
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
  proxyKeyId: string
): Promise<Result<AuthParams, string>> {
  const result = await dbClient
    .from("helicone_proxy_keys")
    .select("org_id")
    .eq("id", proxyKeyId)
    .eq("soft_delete", false)
    .single();

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error.message,
    };
  }

  return {
    data: {
      organizationId: result.data.org_id,
      userId: undefined,
      heliconeApiKeyId: undefined,
    },
    error: null,
  };
}

async function getHeliconeJwtAuthParams(
  dbClient: SupabaseClient<Database>,
  orgId: string,
  heliconeJwt: string
): Promise<Result<AuthParams, string>> {
  const user = await dbClient.auth.getUser(heliconeJwt);
  if (user.error) {
    console.error("Error fetching user:", user.error.message);
    return { error: user.error.message, data: null };
  }

  const orgOwner = await dbClient
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .eq("owner", user.data.user.id)
    .single();

  if (orgOwner.error) {
    console.error("Error fetching user:", orgOwner.error.message);
    return { error: orgOwner.error.message, data: null };
  }

  if (orgOwner.data) {
    return {
      data: {
        organizationId: orgOwner.data.id,
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
  _bearerType: "heliconeProxyKey" | "heliconeApiKey";
  token: string;
};

export type HeliconeAuth = JwtAuth | BearerAuth;

export class DBWrapper {
  private supabaseClient: SupabaseClient<Database>;
  private secureCacheEnv: SecureCacheEnv;
  private atomicRateLimiter: DurableObjectNamespace;
  private rateLimiter?: RateLimiter;
  private authParams?: AuthParams;
  private tier?: string;

  constructor(env: Env, private auth: HeliconeAuth) {
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

  async getAuthParams(): Promise<Result<AuthParams, string>> {
    if (this.authParams !== undefined) {
      return {
        data: this.authParams,
        error: null,
      };
    }
    const cacheKey = (await hash(JSON.stringify(this.auth))).substring(0, 32);
    const cachedAuthParams = await getFromCache(cacheKey, this.secureCacheEnv);
    if (cachedAuthParams !== null) {
      return {
        data: JSON.parse(cachedAuthParams),
        error: null,
      };
    }

    let authParams: Result<AuthParams, string> | undefined;
    switch (this.auth._type) {
      case "jwt":
        if (!this.auth.orgId) {
          return {
            data: null,
            error:
              "Helicone organization id is required for JWT authentication.",
          };
        }
        authParams = await getHeliconeJwtAuthParams(
          this.supabaseClient,
          this.auth.orgId,
          this.auth.token
        );
        break;

      case "bearer":
        authParams =
          this.auth._bearerType === "heliconeProxyKey"
            ? await getHeliconeProxyKeyRow(this.supabaseClient, this.auth.token)
            : await getHeliconeApiKeyRow(this.supabaseClient, this.auth.token);
        break;

      default:
        return { data: null, error: "Invalid authentication." };
    }

    if (!authParams || authParams.error || !authParams.data) {
      return {
        data: null,
        error: authParams?.error || "Invalid authentication.",
      };
    }

    await storeInCache(
      cacheKey,
      JSON.stringify(authParams.data),
      this.secureCacheEnv
    );
    this.authParams = authParams.data;

    return authParams;
  }

  async getTier(): Promise<Result<string, string>> {
    if (this.tier !== undefined) {
      return ok(this.tier);
    }
    const authParams = await this.getAuthParams();
    if (authParams.error !== null) {
      return err(authParams.error);
    }
    const cachedTier = await getFromCache(
      `tier-${authParams.data.organizationId}`,
      this.secureCacheEnv
    );

    if (cachedTier !== null) {
      this.tier = cachedTier;
      return ok(this.tier);
    }

    const { data, error } = await this.supabaseClient
      .from("organization")
      .select("*")
      .eq("id", authParams.data.organizationId)
      .single();

    if (error !== null) {
      return err(error.message);
    }
    this.tier = data?.tier ?? "free";

    await storeInCache(
      `tier-${authParams.data.organizationId}`,
      this.tier,
      this.secureCacheEnv
    );

    return ok(this.tier);
  }

  async recordRateLimitHit(orgId: string, totalCount: number): Promise<void> {
    await this.supabaseClient.from("org_rate_limit_tracker").insert({
      org_id: orgId,
      total_count: totalCount,
    });
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
}
