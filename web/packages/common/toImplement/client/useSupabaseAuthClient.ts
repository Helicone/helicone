import { useOrg } from "@/components/layout/org/organizationContext";
import { Database } from "@/db/database.types";
import { $JAWN_API } from "@/lib/clients/jawn";
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

  const userAndOrg = (await supabaseClient.getUserAndOrg()).data;

  return new SupabaseAuthClient(
    supabaseClient.client,
    {
      email: user.data.user?.email ?? "",
      id: user.data.user?.id ?? "",
    },
    userAndOrg && userAndOrg.org
      ? {
          org: userAndOrg.org,
          role: userAndOrg.role,
        }
      : undefined
  );
}

export class SupabaseAuthClient implements HeliconeAuthClient {
  constructor(
    private supabaseClient?: SupabaseClient<Database>,
    user?: HeliconeUser,
    private org?: { org: HeliconeOrg; role: string }
  ) {}

  async getOrg(): Promise<Result<{ org: HeliconeOrg; role: string }, string>> {
    if (!this.org) {
      return err("Org not found");
    }
    return ok(this.org);
  }

  async signOut(): Promise<void> {
    await this.supabaseClient?.auth.signOut({ scope: "global" });
    await this.supabaseClient?.auth.signOut({ scope: "others" });
    await this.supabaseClient?.auth.signOut({ scope: "local" });
    posthog.reset();
    await this.supabaseClient?.auth.signOut();
  }

  async getUser(): Promise<Result<HeliconeUser, string>> {
    if (!this.supabaseClient) {
      return err("Supabase client not found");
    }
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
    if (!this.supabaseClient) {
      return;
    }
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
    if (!this.supabaseClient) {
      return err("Supabase client not found");
    }
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
    if (!this.supabaseClient) {
      return err("Supabase client not found");
    }
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
    if (!this.supabaseClient) {
      return err("Supabase client not found");
    }
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
    if (!this.supabaseClient) {
      return err("Supabase client not found");
    }
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
    if (!this.supabaseClient) {
      return err("Supabase client not found");
    }
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

  const allOrgs = $JAWN_API.useQuery("get", "/v1/organization", {});
  return useMemo(() => {
    const orgWithRole = allOrgs.data?.data?.find(
      (orgWithRole) => orgWithRole.id === org?.currentOrg?.id
    );

    return new SupabaseAuthClient(
      supabaseClient,
      {
        id: user?.id ?? "",
        email: user?.email ?? "",
      },
      orgWithRole
        ? {
            org: orgWithRole,
            role: orgWithRole.role,
          }
        : undefined
    );
  }, [
    allOrgs.data?.data,
    supabaseClient,
    user?.id,
    user?.email,
    org?.currentOrg?.id,
  ]);
}
