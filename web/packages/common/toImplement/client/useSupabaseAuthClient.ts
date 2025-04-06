import { Database } from "@/db/database.types";
import {
  SupabaseClient,
  useSupabaseClient,
  useUser,
} from "@supabase/auth-helpers-react";
import { useMemo } from "react";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { HeliconeUser } from "../../auth/types";
import posthog from "posthog-js";
import { err, ok, Result } from "../../result";

export class SupabaseAuthClient implements HeliconeAuthClient {
  supabaseClient: SupabaseClient<Database>;
  user?: HeliconeUser;
  constructor(supabaseClient?: SupabaseClient<Database>, user?: HeliconeUser) {
    if (!supabaseClient) {
      throw new Error("Supabase client not found");
    }
    this.supabaseClient = supabaseClient;
    this.user = user;
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
  return useMemo(() => {
    return new SupabaseAuthClient(supabaseClient, {
      id: user?.id ?? "",
      email: user?.email ?? "",
    });
  }, [supabaseClient, user]);
}
