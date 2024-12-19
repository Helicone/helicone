import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { InMemoryCache } from "../cache/staticMemCache";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { Database } from "./database.types";
import { hashAuth } from "../../utils/hash";
import { HeliconeAuth } from "../requestWrapper";
import { redisClient } from "../clients/redisClient";
import { KeyPermissions, Role } from "../../models/models";

require("dotenv").config({
  path: `${__dirname}/../../../.env`,
});

// SINGLETON
class SupabaseAuthCache extends InMemoryCache {
  private static instance: SupabaseAuthCache;
  private API_KEY_CACHE_TTL = 60 * 1000; // 5 minutes
  constructor() {
    super(1_000);
  }

  static getInstance(): SupabaseAuthCache {
    if (!SupabaseAuthCache.instance) {
      SupabaseAuthCache.instance = new SupabaseAuthCache();
    }
    return SupabaseAuthCache.instance;
  }

  set<T>(key: string, value: T): void {
    super.set(key, value, this.API_KEY_CACHE_TTL);
  }
}

class SupabaseOrganizationCache extends InMemoryCache {
  private static instance: SupabaseOrganizationCache;
  private ORGANIZATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  constructor() {
    super(1_000);
  }

  static getInstance(): SupabaseOrganizationCache {
    if (!SupabaseOrganizationCache.instance) {
      SupabaseOrganizationCache.instance = new SupabaseOrganizationCache();
    }
    return SupabaseOrganizationCache.instance;
  }

  set<T>(key: string, value: T): void {
    super.set(key, value, this.ORGANIZATION_CACHE_TTL);
  }
}

export interface AuthParams {
  organizationId: string;
  userId?: string;
  heliconeApiKeyId?: number;
  keyPermissions?: KeyPermissions;
  role?: Role;
}
type AuthResult = PromiseGenericResult<AuthParams>;

export interface OrgParams {
  tier: string;
  id: string;
  percentLog: number;
}

type OrgResult = PromiseGenericResult<OrgParams>;

const SUPABASE_CREDS = JSON.parse(process.env.SUPABASE_CREDS ?? "{}");
const supabaseURL = SUPABASE_CREDS?.url ?? process.env.SUPABASE_URL;
const supabaseServiceRoleKey =
  SUPABASE_CREDS?.service_role_key ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseURL) {
  throw new Error("No Supabase URL");
}

if (!supabaseServiceRoleKey) {
  throw new Error("No Supabase service role key");
}
const staticClient: SupabaseClient<Database> = createClient(
  supabaseURL,
  supabaseServiceRoleKey
);
const authCache = SupabaseAuthCache.getInstance();
const orgCache = SupabaseOrganizationCache.getInstance();

export class SupabaseConnector {
  client: SupabaseClient<Database>;
  connected: boolean = false;
  authCache: SupabaseAuthCache;
  orgCache: SupabaseOrganizationCache;

  constructor() {
    this.client = staticClient;
    this.authCache = authCache;
    this.orgCache = orgCache;
  }

  private async authenticateJWT(jwt: string, orgId?: string): AuthResult {
    if ("string" !== typeof orgId) {
      return err("No organization ID provided with JWT");
    }
    const { data, error } = await this.client.auth.getUser(jwt);
    if (error) {
      return err(error.message);
    }
    if (!data) {
      return err("No data");
    }

    const member = await this.client
      .from("organization_member")
      .select("*")
      .eq("member", data.user.id)
      .eq("organization", orgId);

    const owner = await this.client
      .from("organization")
      .select("*")
      .eq("owner", data.user.id)
      .eq("id", orgId);

    if (member.error || owner.error) {
      const error: string =
        member.error?.message || owner.error?.message || "Unknown error";
      return err(error);
    }
    if (member.data.length !== 0) {
      return ok({
        organizationId: member.data[0].organization,
        userId: data.user.id,
        role: member.data[0].org_role as Role,
      });
    }
    if (owner.data.length !== 0) {
      return ok({
        organizationId: owner.data[0].id,
        userId: data.user.id,
        role: "owner" as Role,
      });
    }

    return err("No organization");
  }

  private async authenticateBearer(bearer: string): AuthResult {
    let apiKey = await this.client
      .from("helicone_api_keys")
      .select("*")
      .eq("api_key_hash", await hashAuth(bearer.replace("Bearer ", "")));

    if (apiKey.error) {
      return err(JSON.stringify(apiKey.error));
    }
    // I dont know how we are getting in this case... but we are in some cases - Justin
    if (apiKey.data.length === 0) {
      apiKey = await this.client
        .from("helicone_api_keys")
        .select("*")
        .eq("api_key_hash", await hashAuth(bearer));
    }

    if (apiKey.error) {
      return err(JSON.stringify(apiKey.error));
    }

    if (apiKey.data.length === 0) {
      return err("No API key found");
    }

    return ok({
      organizationId: apiKey.data[0].organization_id,
      userId: apiKey.data[0].user_id,
      heliconeApiKeyId: apiKey.data[0].id,
      keyPermissions: apiKey.data[0].key_permissions as KeyPermissions,
    });
  }

  private async getProviderKeyFromProxy(authKey: string): AuthResult {
    const proxyKey = authKey?.replace("Bearer ", "").trim();
    const regex =
      /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
    const match = proxyKey.match(regex);

    if (!match) {
      return err("Proxy key id not found");
    }
    const proxyKeyId = match[0];

    const storedProxyKey = await this.client
      .from("helicone_proxy_keys")
      .select("*")
      .eq("id", proxyKeyId)
      .eq("soft_delete", "false")
      .single();
    if (storedProxyKey.error || !storedProxyKey.data) {
      return err("Proxy key not found in storedProxyKey");
    }

    const verified = await this.client.rpc("verify_helicone_proxy_key", {
      api_key: proxyKey,
      stored_hashed_key: storedProxyKey.data.helicone_proxy_key,
    });

    if (verified.error || !verified.data) {
      return err("Proxy key not verified");
    }

    return ok({
      organizationId: storedProxyKey.data.org_id,
    });
  }

  private async getAuthParams(authorization: HeliconeAuth): AuthResult {
    if (authorization._type === "bearerProxy") {
      return this.getProviderKeyFromProxy(authorization.token);
    }
    if (authorization._type === "bearer") {
      return this.authenticateBearer(authorization.token);
    }
    if (authorization._type === "jwt") {
      return this.authenticateJWT(authorization.token, authorization.orgId);
    }
    return err("Invalid auth type");
  }

  async authenticate(
    authorization: HeliconeAuth,
    organizationId?: string
  ): AuthResult {
    const cacheKey = await hashAuth(
      JSON.stringify(authorization) + organizationId
    );

    const cacheResultMem = this.authCache.get<AuthParams>(cacheKey);

    if (cacheResultMem) {
      return ok(cacheResultMem);
    }

    const cachedResultRedis = await redisClient?.get(cacheKey);

    if (cachedResultRedis) {
      try {
        const parsedResult: AuthParams = JSON.parse(cachedResultRedis);
        this.authCache.set(cacheKey, parsedResult);
        return ok(parsedResult);
      } catch (e) {
        console.error("Failed to parse cached result:", e);
      }
    }

    if (
      authorization.token.includes("sk-helicone-proxy") ||
      authorization.token.includes("pk-helicone-proxy")
    ) {
      authorization._type = "bearerProxy";
    }

    const result = await this.getAuthParams(authorization);

    if (result.error || !result.data) {
      return err(result.error);
    }

    const {
      organizationId: orgId,
      userId,
      heliconeApiKeyId,
      keyPermissions,
      role,
    } = result.data;

    if (!orgId) {
      return err("No organization ID");
    }

    const authParamsResult: AuthParams = {
      organizationId: orgId,
      userId,
      heliconeApiKeyId,
      keyPermissions,
      role,
    };

    this.authCache.set(cacheKey, authParamsResult);

    await redisClient?.set(
      cacheKey,
      JSON.stringify(authParamsResult),
      "EX",
      3600 // 1 hour
    );

    return ok(authParamsResult);
  }

  async getOrganization(authParams: AuthParams): Promise<OrgResult> {
    const cacheKey = `org:${authParams.organizationId}`;

    const cacheResultMem = this.orgCache.get<OrgParams>(cacheKey);

    if (cacheResultMem) {
      return ok(cacheResultMem);
    }

    const cachedResult = await redisClient?.get(cacheKey);

    if (cachedResult) {
      try {
        const parsedResult: OrgParams = JSON.parse(cachedResult);
        this.orgCache.set(cacheKey, parsedResult);
        return ok(parsedResult);
      } catch (e) {
        console.error("Failed to parse cached result:", e);
      }
    }

    const { data, error } = await this.client
      .from("organization")
      .select("*")
      .eq("id", authParams.organizationId)
      .single();

    if (error || !data) {
      return err(error?.message || "Unknown error");
    }

    const orgResult: OrgParams = {
      tier: data.tier ?? "free",
      id: data.id ?? "",
      percentLog: data.percent_to_log ?? 100_000,
    };

    this.orgCache.set(cacheKey, orgResult);

    await redisClient?.set(cacheKey, JSON.stringify(orgResult), "EX", 3600); // 1 hour

    return ok(orgResult);
  }
}

export const supabaseServer = new SupabaseConnector();
