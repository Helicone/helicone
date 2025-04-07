import { useOrg } from "@/components/layout/org/organizationContext";
import { Database } from "@/db/database.types";
import { dbExecute } from "@/lib/api/db/dbExecute";
import { ORG_ID_COOKIE_KEY } from "@/lib/constants";
import { SupabaseServerWrapper } from "@/lib/wrappers/supabase";
import {
  SupabaseClient,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import posthog from "posthog-js";
import { useMemo } from "react";
import { SSRContext } from "../../auth/client/AuthClientFactory";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { HeliconeOrg, HeliconeUser } from "../../auth/types";
import { err, ok, Result } from "../../result";

export async function supabaseAuthClientFromSSRContext(
  ctx: SSRContext<NextApiRequest, NextApiResponse, GetServerSidePropsContext>
) {
  const supabaseClient = new SupabaseServerWrapper(ctx);
  const user = await supabaseClient.getClient().auth.getUser();

  return new SupabaseAuthClient(
    supabaseClient.client,
    {
      email: user.data.user?.email ?? "",
      id: user.data.user?.id ?? "",
    },
    ctx.req.cookies?.[ORG_ID_COOKIE_KEY]
  );
}

export class SupabaseAuthClient implements HeliconeAuthClient {
  supabaseClient: SupabaseClient<Database>;
  user?: HeliconeUser;
  constructor(
    supabaseClient?: SupabaseClient<Database>,
    user?: HeliconeUser,
    private orgId?: string
  ) {
    if (!supabaseClient) {
      throw new Error("Supabase client not found");
    }
    this.supabaseClient = supabaseClient;
    this.user = user;
  }

  async getOrg(): Promise<Result<{ org: HeliconeOrg; role: string }, string>> {
    if (!this.orgId) {
      return err("Org not found");
    }
    if (!this.user?.id) {
      return err("User not found");
    }

    const org = await dbExecute<HeliconeOrg & { role: string }>(
      `SELECT organization.*, organization_member.role FROM organization
      left join organization_member on organization.id = organization_member.organization
       WHERE id = $1 and organization_member.member = $2`,
      [this.orgId, this.user.id]
    );
    if (!org.data || org.data.length === 0 || org.error) {
      return err(org.error ?? "Org not found");
    }

    return ok({
      org: org.data[0],
      role: org.data[0].role,
    });
  }

  async signOut(): Promise<void> {
    await this.supabaseClient.auth.signOut({ scope: "global" });
    await this.supabaseClient.auth.signOut({ scope: "others" });
    await this.supabaseClient.auth.signOut({ scope: "local" });
    posthog.reset();
    await this.supabaseClient.auth.signOut();
  }

  async getUser(): Promise<Result<HeliconeUser, string>> {
    const user = await this.supabaseClient.auth.getUser();
    if (!user.data.user) {
      return err("User not found");
    }
    return ok({
      id: user.data.user.id,
      email: user.data.user.email ?? "",
      user_metadata: user.data.user.user_metadata,
    });
  }

  async refreshSession(): Promise<void> {
    await this.supabaseClient.auth.refreshSession();
  }

  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { emailRedirectTo?: string };
  }): Promise<Result<HeliconeUser, string>> {
    const { data: user, error: authError } =
      await this.supabaseClient.auth.signUp({
        email,
        password,
        options,
      });
    if (authError) {
      return err(authError.message);
    }
    return ok({
      id: user.user?.id ?? "",
      email: user.user?.email ?? "",
      user_metadata: user.user?.user_metadata,
    });
  }

  async resetPassword({
    email,
    options,
  }: {
    email: string;
    options?: { emailRedirectTo?: string };
  }): Promise<Result<void, string>> {
    const { data: user, error: authError } =
      await this.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: options?.emailRedirectTo,
      });
    if (authError) {
      return err(authError.message);
    }
    return ok(undefined);
  }

  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<Result<HeliconeUser, string>> {
    const { data: user, error: authError } =
      await this.supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
    if (authError) {
      return err(authError.message);
    }
    return ok({
      id: user.user?.id ?? "",
      email: user.user?.email ?? "",
      user_metadata: user.user?.user_metadata,
    });
  }

  async signInWithOAuth({
    provider,
    options,
  }: {
    provider: "google" | "github";
    options?: { redirectTo?: string };
  }): Promise<Result<void, string>> {
    const { data, error } = await this.supabaseClient.auth.signInWithOAuth({
      provider,
      options,
    });
    if (error) {
      return err(error.message);
    }
    return ok(undefined);
  }

  async updateUser({
    password,
  }: {
    password: string;
  }): Promise<Result<void, string>> {
    const { data: user, error: authError } =
      await this.supabaseClient.auth.updateUser({
        password,
      });
    if (authError) {
      return err(authError.message);
    }
    return ok(undefined);
  }
}

export function useSupabaseAuthClient(): HeliconeAuthClient {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useUser();
  const org = useOrg();
  return useMemo(() => {
    return new SupabaseAuthClient(
      supabaseClient,
      {
        id: user?.id ?? "",
        email: user?.email ?? "",
      },
      org?.currentOrg?.id
    );
  }, [supabaseClient, user, org]);
}
