import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { InMemoryCache } from "../memoryCache/staticMemCache";
import { PromiseGenericResult, err, ok } from "../modules/result";
import { Database } from "./database.types";
import { hashAuth } from "./hash";
import { HeliconeAuth } from "../requestWrapper";

// SINGLETON
class SupabaseAuthCache extends InMemoryCache {
  private static instance: SupabaseAuthCache;
  private API_KEY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
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

export interface AuthParams {
  organizationId: string;
}
type AuthResult = PromiseGenericResult<AuthParams>;

const SUPABASE_CREDS = JSON.parse(process.env.SUPABASE_CREDS ?? "{}");
const supabaseURL = SUPABASE_CREDS?.url;
const supabaseServiceRoleKey = SUPABASE_CREDS?.service_role_key;
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

export class SupabaseConnector {
  client: SupabaseClient<Database>;
  connected: boolean = false;
  organizationId?: string;
  authCache: SupabaseAuthCache;

  constructor() {
    this.client = staticClient;
    this.authCache = authCache;
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
      .eq("user_id", data.user.id)
      .eq("organization_id", orgId);

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
      });
    }
    if (owner.data.length !== 0) {
      return ok({
        organizationId: owner.data[0].id,
      });
    }

    return err("No organization");
  }

  private async authenticateBearer(bearer: string): AuthResult {
    const apiKey = await this.client
      .from("helicone_api_keys")
      .select("*")
      .eq("api_key_hash", await hashAuth(bearer.replace("Bearer ", "")));
    if (apiKey.error) {
      return err(JSON.stringify(apiKey.error));
    }
    if (apiKey.data.length === 0) {
      return err("No API key found");
    }
    return ok({
      organizationId: apiKey.data[0].organization_id,
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
    const cachedResult = this.authCache.get<AuthParams>(
      await hashAuth(JSON.stringify(authorization) + organizationId)
    );
    if (cachedResult) {
      this.organizationId = (await cachedResult).organizationId;
      return ok(cachedResult);
    }

    const result = await this.getAuthParams(authorization);

    if (result.error) {
      return err(result.error);
    }
    const { organizationId: orgId } = result.data!;
    if (!orgId) {
      return err("No organization ID");
    }

    this.organizationId = orgId;
    this.authCache.set(
      await hashAuth(JSON.stringify(authorization) + organizationId),
      { organizationId: orgId }
    );
    return ok({
      organizationId: orgId,
    });
  }
}

export const supabaseServer = new SupabaseConnector();
