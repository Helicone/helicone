import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Database } from "../../supabase/database.types";
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

export type HeliconeAuth =
  | {
      heliconeApiKeyAuthHash: string;
      heliconeProxyKeyId: undefined;
    }
  | {
      heliconeApiKeyAuthHash: undefined;
      heliconeProxyKeyId: string;
    };

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

    const authParams = this.auth.heliconeProxyKeyId
      ? await getHeliconeProxyKeyRow(
          this.supabaseClient,
          this.auth.heliconeProxyKeyId
        )
      : await getHeliconeApiKeyRow(
          this.supabaseClient,
          this.auth.heliconeApiKeyAuthHash
        );

    if (authParams.error === null) {
      await storeInCache(
        cacheKey,
        JSON.stringify(authParams.data),
        this.secureCacheEnv
      );
      this.authParams = authParams.data;
    }
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
}
