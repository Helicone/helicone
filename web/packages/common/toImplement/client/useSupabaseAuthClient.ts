import { Database } from "@/db/database.types";
import {
  SupabaseClient,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import posthog from "posthog-js";
import { useMemo } from "react";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { HeliconeOrg, HeliconeUser } from "../../auth/types";
import { err, ok, Result } from "../../result";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

export class SupabaseAuthClient implements HeliconeAuthClient {
  user: HeliconeUser | undefined;
  constructor(
    private supabaseClient?: SupabaseClient<Database>,
    user?: HeliconeUser,
    private org?: { org: HeliconeOrg; role: string },
    private queryClient?: QueryClient,
  ) {
    this.user = user;
  }

  async getOrg(): Promise<Result<{ org: HeliconeOrg; role: string }, string>> {
    if (!this.org) {
      return err("Org not found");
    }
    return ok(this.org);
  }

  async signOut(): Promise<void> {
    if (this.queryClient) {
      this.queryClient.clear();
    }

    await this.supabaseClient?.auth.signOut({ scope: "global" });
    await this.supabaseClient?.auth.signOut({ scope: "others" });
    await this.supabaseClient?.auth.signOut({ scope: "local" });
    posthog.reset();
    await this.supabaseClient?.auth.signOut();
  }

  hasSupabaseClient(): boolean {
    if (!("supabaseClient" in this)) {
      return false;
    }

    return !!this.supabaseClient;
  }

  async getUser(): Promise<Result<HeliconeUser, string>> {
    if (!this || !this.hasSupabaseClient()) {
      return err("Supabase client not found");
    }
    const user = await this.supabaseClient!.auth.getUser();
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
    if (this.queryClient) {
      this.queryClient.clear();
    }
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
    if (this.queryClient) {
      this.queryClient.clear();
    }

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

  async signInWithSSO({
    domain,
    options,
  }: {
    domain: string;
    options?: { redirectTo?: string };
  }): Promise<Result<void, string>> {
    if (this.queryClient) {
      this.queryClient.clear();
    }

    if (!this.supabaseClient) {
      return err("Supabase client not found");
    }
    const { data, error } = await this.supabaseClient.auth.signInWithSSO({
      domain,
      options,
    });
    if (error) {
      return err(error.message);
    }
    if (data?.url) {
      window.location.href = data.url;
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

  async changePassword({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }): Promise<Result<void, string>> {
    throw new Error("Not implemented");
  }
}

export function useSupabaseAuthClient(): HeliconeAuthClient {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useUser();
  const queryClient = useQueryClient();

  return useMemo(() => {
    return new SupabaseAuthClient(
      supabaseClient,
      {
        id: user?.id ?? "",
        email: user?.email ?? "",
      },
      undefined,
      queryClient,
    );
  }, [supabaseClient, user?.id, user?.email, queryClient]);
}
