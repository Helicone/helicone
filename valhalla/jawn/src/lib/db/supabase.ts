import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { KeyPermissions, Role } from "../../models/models";
import { cacheResultCustom } from "../../utils/cacheResult";
import { hashAuth } from "../../utils/hash";
import { KVCache } from "../cache/kvCache";
import { HeliconeAuth } from "../requestWrapper";
import { PromiseGenericResult, err, ok } from "../shared/result";
import { Database } from "./database.types";

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
  has_onboarded: boolean;
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

const kvCache = new KVCache(10 * 1000); // 10 seconds

export class SupabaseConnector {
  client: SupabaseClient<Database>;
  connected: boolean = false;

  constructor() {
    this.client = staticClient;
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
      .eq("api_key_hash", await hashAuth(bearer.replace("Bearer ", "")))
      .eq("soft_delete", false);

    if (apiKey.error) {
      return err(JSON.stringify(apiKey.error));
    }
    // I dont know how we are getting in this case... but we are in some cases - Justin
    if (apiKey.data.length === 0) {
      apiKey = await this.client
        .from("helicone_api_keys")
        .select("*")
        .eq("api_key_hash", await hashAuth(bearer))
        .eq("soft_delete", false);
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

  private async uncachedAuth(
    authorization: HeliconeAuth,
    organizationId?: string
  ): AuthResult {
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

    return ok(authParamsResult);
  }
  async authenticate(
    authorization: HeliconeAuth,
    organizationId?: string
  ): AuthResult {
    const cacheKey = await hashAuth(
      JSON.stringify(authorization) + organizationId
    );
    return await cacheResultCustom(
      cacheKey,
      async () => await this.uncachedAuth(authorization, organizationId),
      kvCache
    );
  }

  private async uncachedGetOrganization(
    authParams: AuthParams
  ): Promise<OrgResult> {
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
      has_onboarded: data.has_onboarded ?? false,
    };

    return ok(orgResult);
  }

  async getOrganization(authParams: AuthParams): Promise<OrgResult> {
    const cacheKey = `org:${authParams.organizationId}`;
    return await cacheResultCustom(
      cacheKey,
      async () => await this.uncachedGetOrganization(authParams),
      kvCache
    );
  }
}

export const supabaseServer = new SupabaseConnector();
