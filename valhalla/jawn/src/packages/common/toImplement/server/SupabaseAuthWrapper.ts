import {
  AuthResult,
  HeliconeAuth,
  JwtAuth,
  KeyPermissions,
  OrgResult,
  Role,
} from "../../auth/types";
import { dbExecute } from "../../../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../result";
import { HeliconeAuthClient } from "../../auth/server/HeliconeAuthClient";
import { AuthParams } from "../../auth/types";
import { OrgParams } from "../../auth/types";
import { HeliconeUserResult } from "../../auth/types";
import { createClient } from "@supabase/supabase-js";
import { KVCache } from "../../../../lib/cache/kvCache";
import { Database } from "../../../../lib/db/database.types";
import { SupabaseClient } from "@supabase/supabase-js";
import { hashAuth } from "../../../../lib/db/hash";
import { SecretManager } from "@helicone-package/secrets/SecretManager";
import { cacheResultCustom } from "../../../../utils/cacheResult";
import { authenticateBearer } from "./common";

const kvCache = new KVCache(10 * 1000); // 10 seconds

export class SupabaseConnector {
  client: SupabaseClient<Database>;
  connected: boolean = false;

  constructor() {
    const SUPABASE_CREDS = JSON.parse(
      SecretManager.getSecret("SUPABASE_CREDS") ?? "{}",
    );
    const supabaseURL =
      SUPABASE_CREDS?.url ??
      process.env.SUPABASE_URL ??
      SecretManager.getSecret("SUPABASE_URL");
    const supabaseServiceRoleKey =
      SUPABASE_CREDS?.service_role_key ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      SecretManager.getSecret(
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_SERVICE_KEY",
      );
    if (!supabaseURL) {
      throw new Error("No Supabase URL");
    }

    if (!supabaseServiceRoleKey) {
      throw new Error("No Supabase service role key");
    }
    const staticClient: SupabaseClient<Database> = createClient(
      supabaseURL,
      supabaseServiceRoleKey,
    );

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
      .select("*, organization(id,tier)")
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
        organizationId: member.data[0].organization.id,
        userId: data.user.id,
        role: member.data[0].org_role as Role,
        tier: member.data[0].organization.tier ?? "",
      });
    }
    if (owner.data.length !== 0) {
      return ok({
        organizationId: owner.data[0].id,
        userId: data.user.id,
        role: "owner" as Role,
        tier: owner.data[0].tier ?? "free",
      });
    }

    return err("No organization");
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
      .eq("soft_delete", false)
      .single();
    if (storedProxyKey.error || !storedProxyKey.data) {
      return err("Proxy key not found in storedProxyKey");
    }

    const verified = await (this.client.rpc as any)(
      "verify_helicone_proxy_key",
      {
        api_key: proxyKey,
        stored_hashed_key: storedProxyKey.data.helicone_proxy_key,
      },
    );

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
      return authenticateBearer(authorization.token);
    }
    if (authorization._type === "jwt") {
      return this.authenticateJWT(authorization.token, authorization.orgId);
    }
    return err("Invalid auth type");
  }

  private async uncachedAuth(
    authorization: HeliconeAuth,
    organizationId?: string,
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
      tier,
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
      tier,
    };

    return ok(authParamsResult);
  }
  async authenticate(
    authorization: HeliconeAuth,
    organizationId?: string,
  ): AuthResult {
    const cacheKey = await hashAuth(
      JSON.stringify(authorization) + organizationId,
    );
    return await cacheResultCustom(
      cacheKey,
      async () => await this.uncachedAuth(authorization, organizationId),
      kvCache,
    );
  }

  private async uncachedGetOrganization(
    authParams: AuthParams,
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
      has_integrated: data.has_integrated ?? false,
    };

    return ok(orgResult);
  }

  async getOrganization(authParams: AuthParams): Promise<OrgResult> {
    const cacheKey = `org:${authParams.organizationId}`;
    return await cacheResultCustom(
      cacheKey,
      async () => await this.uncachedGetOrganization(authParams),
      kvCache,
    );
  }
}

export class SupabaseAuthWrapper implements HeliconeAuthClient {
  supabaseServer: SupabaseConnector;

  constructor() {
    this.supabaseServer = new SupabaseConnector();
  }

  async getUser(auth: JwtAuth): HeliconeUserResult {
    const user = await this.supabaseServer.client.auth.getUser(auth.token);
    if (user.error) {
      return err(user.error.message);
    }
    if (!user.data.user?.id) {
      return err("User not found");
    }

    return ok({
      email: user.data.user?.email ?? "",
      id: user.data.user.id ?? "",
    });
  }

  async getUserById(userId: string): HeliconeUserResult {
    const user =
      await this.supabaseServer.client.auth.admin.getUserById(userId);
    if (user.error) {
      return err(user.error.message);
    }
    if (!user.data.user.email) {
      return err("User not found");
    }
    return ok({
      email: user.data.user.email,
      id: userId,
    });
  }
  async getUserByEmail(email: string): HeliconeUserResult {
    const getUserIdQuery = `
      SELECT id FROM auth.users WHERE email = $1 LIMIT 1
    `;
    let { data: userId, error: userIdError } = await dbExecute<{ id: string }>(
      getUserIdQuery,
      [email],
    );

    if (userIdError) {
      return err(userIdError ?? "User not found");
    }

    if (!userId || userId.length === 0) {
      return err("User not found");
    }

    return ok({
      email,
      id: userId[0].id,
    });
  }

  async authenticate(auth: HeliconeAuth): Promise<Result<AuthParams, string>> {
    return await this.supabaseServer.authenticate(auth);
  }
  async getOrganization(
    authParams: AuthParams,
  ): Promise<Result<OrgParams, string>> {
    return await this.supabaseServer.getOrganization(authParams);
  }
  async createUser({
    email,
    password,
    otp,
  }: {
    email: string;
    password?: string;
    otp?: boolean;
  }): HeliconeUserResult {
    if (otp) {
      const createUserResult =
        await this.supabaseServer.client.auth.signInWithOtp({
          email,
        });
      if (createUserResult.error) {
        return err(createUserResult.error.message);
      }

      return await this.getUserByEmail(email);
    } else {
      throw new Error("not implemented");
    }
  }
}
