import { Env, hash } from "../..";
import { Database } from "../../../supabase/database.types";
import { PostgresClient } from "./postgres";
import pgPromise from "pg-promise";
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

export type RateLimitPolicy = {
  name: string;
  id: string;
  quota: number;
  unit: "request" | "cents";
  windowSeconds: number;
  segment: string | undefined;
};

const RATE_LIMIT_CACHE_TTL = 120; // 2 minutes

async function getHeliconeApiKeyRow(
  sql: pgPromise.IDatabase<any>,
  heliconeApi: string
): Promise<Result<InternalAuthParams, string>> {
  try {
    const hashedKey = await hash(heliconeApi);
    const data = await sql.oneOrNone(
      `SELECT * FROM helicone_api_keys
       WHERE api_key_hash = $1
       AND soft_delete = false
       LIMIT 1`,
      [hashedKey]
    );

    if (!data) {
      return { data: null, error: "API key not found" };
    }
    
    return {
      data: {
        organizationId: data.organization_id,
        userId: data.user_id,
        heliconeApiKeyId: data.id,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: (error as any).message || "Database error" };
  }
}
async function getHeliconeProxyKeyRow(
  sql: pgPromise.IDatabase<any>,
  { token }: BearerAuthProxy,
  env: Env
): Promise<Result<InternalAuthParams, string>> {
  const { data, error } = await getProviderKeyFromProxyCache(
    token,
    env,
    sql
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

export type BearerAuth = {
  _type: "bearer";
  token: string;
};

export type BearerAuthProxy = {
  _type: "bearerProxy";
  token: string;
};

export type HeliconeAuth = BearerAuthProxy | BearerAuth;

export class DBWrapper {
  private postgresClient: PostgresClient;
  private secureCacheEnv: SecureCacheEnv;
  private atomicRateLimiter: DurableObjectNamespace;
  private rateLimiter?: RateLimiter;
  private authParams?: AuthParams;
  private tier?: string;

  constructor(private env: Env, private auth: HeliconeAuth) {
    this.postgresClient = new PostgresClient(env);
    this.secureCacheEnv = {
      REQUEST_CACHE_KEY: env.REQUEST_CACHE_KEY,
      SECURE_CACHE: env.SECURE_CACHE,
    };
    this.atomicRateLimiter = env.RATE_LIMITER;
  }

  getClient(): pgPromise.IDatabase<any> {
    return this.postgresClient.client;
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
      case "bearerProxy":
        return getHeliconeProxyKeyRow(this.postgresClient.client, this.auth, this.env);
      case "bearer":
        return getHeliconeApiKeyRow(this.postgresClient.client, this.auth.token);
    }
    throw new Error("Invalid authentication."); // this is unreachable
  }

  private async _getAuthParams(): Promise<Result<AuthParams, string>> {
    const internalAuthParams = await this._getAuthParamsInternal();
    if (internalAuthParams.error !== null) {
      return err(internalAuthParams.error);
    }

    try {
      const org = await this.postgresClient.client.oneOrNone(
        `SELECT * FROM organization
         WHERE id = $1
         LIMIT 1`,
        [internalAuthParams.data.organizationId]
      );

      if (!org) {
        return err("Organization not found");
      }

      return ok({
        organizationId: internalAuthParams.data.organizationId,
        userId: internalAuthParams.data.userId,
        heliconeApiKeyId: internalAuthParams.data.heliconeApiKeyId,
        tier: org.tier ?? "free",
        accessDict: {
          cache: true,
        },
      });
    } catch (error) {
      return err((error as any).message || "Database error");
    }
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

  async getAllRateLimitPolicies(): Promise<Result<RateLimitPolicy[], string>> {
    const authParams = await this.getAuthParams();
    if (authParams.error !== null) {
      return err(authParams.error);
    }

    return await getAndStoreInCache<RateLimitPolicy[], string>(
      `rateLimitOptions-${authParams.data.organizationId}`,
      this.secureCacheEnv,
      async () => {
        try {
          const data = await this.postgresClient.client.query(
            `SELECT * FROM org_rate_limits
             WHERE organization_id = $1
             AND deleted_at IS NULL`,
            [authParams.data.organizationId]
          );

          if (!data || data.length === 0) {
            return ok([]);
          }

          const mappedData: RateLimitPolicy[] = data.map((dbPolicy: any) => ({
            id: dbPolicy.id,
            organization_id: dbPolicy.organization_id,
            quota: dbPolicy.quota,
            windowSeconds: dbPolicy.window_seconds,
            unit: dbPolicy.unit as "request" | "cents",
            segment: dbPolicy.segment ?? undefined,
            name: dbPolicy.name,
          }));

          return ok(mappedData);
        } catch (error) {
          return err((error as any).message || "Database error");
        }
      },
      RATE_LIMIT_CACHE_TTL
    );
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
        try {
          const data = await this.postgresClient.client.oneOrNone(
            `SELECT * FROM organization
             WHERE id = $1
             LIMIT 1`,
            [authParams.data.organizationId]
          );

          if (!data) {
            return err("Organization not found");
          }
          
          return ok({
            tier: data.tier ?? "free",
            id: data.id ?? "",
            percentLog: data.percent_to_log ?? 100_000,
          });
        } catch (error) {
          return err((error as any).message || "Database error");
        }
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
    try {
      const orgId = await this.orgId();
      const data = await this.postgresClient.client.oneOrNone(
        `SELECT * FROM job
         WHERE id = $1
         AND org_id = $2
         LIMIT 1`,
        [jobId, orgId]
      );
      
      if (!data) {
        return { data: null, error: "Job not found" };
      }
      return { data: data as Database["public"]["Tables"]["job"]["Row"], error: null };
    } catch (error) {
      return { data: null, error: (error as any).message || "Database error" };
    }
  }

  async getNodeById(
    nodeId: string
  ): Promise<Result<Database["public"]["Tables"]["job_node"]["Row"], string>> {
    try {
      const orgId = await this.orgId();
      const data = await this.postgresClient.client.oneOrNone(
        `SELECT * FROM job_node
         WHERE id = $1
         AND org_id = $2
         LIMIT 1`,
        [nodeId, orgId]
      );
      
      if (!data) {
        return { data: null, error: "Node not found" };
      }
      return { data: data as Database["public"]["Tables"]["job_node"]["Row"], error: null };
    } catch (error) {
      return { data: null, error: (error as any).message || "Database error" };
    }
  }

  async getRequestById(
    requestId: string
  ): Promise<Result<Database["public"]["Tables"]["request"]["Row"], string>> {
    try {
      const orgId = await this.orgId();
      const data = await this.postgresClient.client.oneOrNone(
        `SELECT * FROM request
         WHERE id = $1
         AND helicone_org_id = $2
         LIMIT 1`,
        [requestId, orgId]
      );
      
      if (!data) {
        return { data: null, error: "Request not found" };
      }
      return { data: data as Database["public"]["Tables"]["request"]["Row"], error: null };
    } catch (error) {
      return { data: null, error: (error as any).message || "Database error" };
    }
  }

  async insertAlert(
    alert: Database["public"]["Tables"]["alert"]["Insert"]
  ): Promise<Result<Database["public"]["Tables"]["alert"]["Row"], string>> {
    try {
      const data = await this.postgresClient.client.one(
        `INSERT INTO alert (${Object.keys(alert).join(', ')})
         VALUES (${Object.keys(alert).map((_, i) => `$${i + 1}`).join(', ')})
         RETURNING *`,
        Object.values(alert)
      );
      
      return { data: data as Database["public"]["Tables"]["alert"]["Row"], error: null };
    } catch (error) {
      return { data: null, error: (error as any).message || "Database error" };
    }
  }

  async deleteAlert(
    alertId: string,
    orgId: string
  ): Promise<Result<null, string>> {
    try {
      await this.postgresClient.client.none(
        `UPDATE alert
         SET soft_delete = true
         WHERE id = $1
         AND org_id = $2`,
        [alertId, orgId]
      );
      
      return { error: null, data: null };
    } catch (error) {
      return { error: (error as any).message || "Database error", data: null };
    }
  }

  async uploadLogo(
    logoFile: File,
    logoUrl: string,
    orgId: string
  ): Promise<Result<null, string>> {
    // Storage operations need to be handled differently without Supabase Storage
    // This would need integration with an alternative storage service (e.g., S3, Cloudflare R2)
    return err("Logo upload requires migration to an alternative storage service");
  }

  async getLogoPath(orgId: string): Promise<Result<string, string>> {
    try {
      const organization = await this.postgresClient.client.oneOrNone(
        `SELECT * FROM organization
         WHERE id = $1
         LIMIT 1`,
        [orgId]
      );

      console.log(`organization: ${JSON.stringify(organization)}`);

      if (!organization) {
        return err("Failed to get organization.");
      }

      // If logo path is already set, return it
      if (organization.logo_path) {
        return ok(organization.logo_path);
      }

      if (!organization.reseller_id) {
        return err("Reseller id not found on organization.");
      }

      // Get logo path from reseller id
      const resellerOrg = await this.postgresClient.client.oneOrNone(
        `SELECT * FROM organization
         WHERE organization_id = $1
         LIMIT 1`,
        [organization.reseller_id]
      );

      if (!resellerOrg?.logo_path) {
        return err("Failed to get logo path from reseller id.");
      }

      return ok(resellerOrg.logo_path);
    } catch (error) {
      return err((error as any).message || "Database error");
    }
  }
}
