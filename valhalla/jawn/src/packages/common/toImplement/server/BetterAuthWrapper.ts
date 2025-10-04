import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import { fromNodeHeaders } from "better-auth/node";
import { Pool } from "pg";
import { Database } from "../../../../lib/db/database.types";
import { dbExecute } from "../../../../lib/shared/db/dbExecute";
import { SecretManager } from "@helicone-package/secrets/SecretManager";
import {
  GenericHeaders,
  HeliconeAuthClient,
} from "../../auth/server/HeliconeAuthClient";
import {
  AuthParams,
  HeliconeAuth,
  HeliconeUserResult,
  JwtAuth,
  OrgParams,
  OrgResult,
  Role,
} from "../../auth/types";
import { err, ok, Result } from "../../result";
import { authenticateBearer } from "./common";

export const betterAuthClient = betterAuth({
  database: new Pool({
    connectionString: SecretManager.getSecret(
      "SUPABASE_DATABASE_URL", // TODO remove supabase URL eventually
      "DATABASE_URL",
    ),
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  logger: {
    log: (message: string) => {
      console.log(message);
    },
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3008"],
  plugins: [
    customSession(async ({ user, session }) => {
      const dbUser = await getUserByBetterAuthId(user.id);
      if (dbUser.error || !dbUser.data) {
        console.warn("could not fetch authUserId from db");
        return {
          user,
          session,
        };
      }

      return {
        user: {
          authUserId: dbUser.data.id,
          ...user,
        },
        session,
      };
    }),
  ],
});

export class BetterAuthWrapper implements HeliconeAuthClient {
  constructor() {}

  async getUser(auth: JwtAuth, headers?: GenericHeaders): HeliconeUserResult {
    if (!headers) {
      return err("No headers provided");
    }
    const hds = fromNodeHeaders(headers);

    const session = await betterAuthClient.api.getSession({
      headers: hds,
    });
    if (!session) {
      return err("Invalid session");
    }

    const user = await dbExecute<{
      user_id: string;
      email: string;
    }>(
      `SELECT 
        public.user.auth_user_id as user_id, 
        public.user.email
      FROM public.user
      LEFT JOIN auth.users on public.user.auth_user_id = auth.users.id
      WHERE public.user.id = $1`,
      [session.user.id],
    );
    if (!user || !user.data?.[0]) {
      return err("User not found");
    }

    return ok({
      id: user.data?.[0]?.user_id,
      email: user.data?.[0]?.email,
    });
  }

  async getUserById(userId: string): HeliconeUserResult {
    throw new Error("Not implemented");
  }

  async getUserByEmail(email: string): HeliconeUserResult {
    const user = await dbExecute<{
      user_id: string;
      email: string;
    }>(
      `SELECT 
        public.user.auth_user_id as user_id, 
        public.user.email
      FROM public.user
      LEFT JOIN auth.users on public.user.auth_user_id = auth.users.id
      WHERE public.user.email = $1`,
      [email],
    );
    if (!user || !user.data?.[0]) {
      return err("User not found");
    }

    return ok({
      id: user.data?.[0]?.user_id,
      email: user.data?.[0]?.email,
    });
  }

  async authenticate(
    auth: HeliconeAuth,
    headers?: GenericHeaders,
  ): Promise<Result<AuthParams, string>> {
    if (auth._type === "jwt") {
      const user = await this.getUser(auth, headers);
      if (user.error) {
        return err(user.error);
      }
      const org = await dbExecute<
        Database["public"]["Tables"]["organization"]["Row"] & {
          role: Role;
        }
      >(
        `SELECT organization.*, organization_member.org_role as role FROM organization 
  left join organization_member on organization_member.organization = organization.id
  where 
  organization.id = $1
  and organization_member.member = $2
  limit 1
  `,
        [auth.orgId, user.data?.id],
      );

      if (!org?.data?.[0]?.id || !org?.data?.[0]?.role) {
        return err("Invalid organization");
      }

      return ok({
        user: user.data,
        userId: user.data?.id,
        organizationId: org?.data?.[0]?.id ?? "",
        role: org?.data?.[0]?.role ?? "member",
        tier: org?.data?.[0]?.tier ?? "free",
      });
    } else if (auth._type === "bearer") {
      return authenticateBearer(auth.token);
    }

    return err("Not implemented");
  }

  private async uncachedGetOrganization(
    authParams: AuthParams,
  ): Promise<OrgResult> {
    const org = await dbExecute<
      Database["public"]["Tables"]["organization"]["Row"] & {
        role: Role;
      }
    >(
      `SELECT organization.*, organization_member.org_role as role FROM organization 
left join organization_member on organization_member.organization = organization.id
where 
organization.id = $1
and organization_member.member = $2
limit 1
`,
      [authParams.organizationId, authParams.userId],
    );

    const orgResult: OrgParams = {
      tier: org?.data?.[0]?.tier ?? "free",
      id: org?.data?.[0]?.id ?? "",
      percentLog: org?.data?.[0]?.percent_to_log ?? 100_000,
      has_onboarded: org?.data?.[0]?.has_onboarded ?? false,
      has_integrated: org?.data?.[0]?.has_integrated ?? false,
    };

    return ok(orgResult);
  }

  async getOrganization(
    authParams: AuthParams,
  ): Promise<Result<OrgParams, string>> {
    return await this.uncachedGetOrganization(authParams);
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
    try {
      const result = await betterAuthClient.api.signUpEmail({
        body: {
          email: email,
          password: password ?? "",
          name: "",
        },
      });
      if (result.user) {
        // the ID returned from signUpEmail is not a UUID, so we need to get the user by email
        const getUserResult = await this.getUserByEmail(email);
        return ok({
          id: getUserResult.data?.id ?? "",
          email: getUserResult.data?.email ?? "",
        });
      }

      return err("Signup process outcome unclear. Check verification steps.");
    } catch (error: any) {
      console.error(error.message || "Better Auth sign up error");
      return err(error.message || "Sign up failed");
    }
  }
}

async function getUserByBetterAuthId(userId: string): HeliconeUserResult {
  const user = await dbExecute<{
    user_id: string;
    email: string;
  }>(
    `SELECT 
      public.user.auth_user_id as user_id, 
      public.user.email
    FROM public.user
    LEFT JOIN auth.users on public.user.auth_user_id = auth.users.id
    WHERE public.user.id = $1`,
    [userId],
  );
  if (!user || !user.data?.[0]) {
    return err("User not found");
  }

  return ok({
    id: user.data?.[0]?.user_id,
    email: user.data?.[0]?.email,
  });
}
