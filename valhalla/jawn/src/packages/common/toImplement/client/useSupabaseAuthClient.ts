import { SSRContext } from "../../auth/client/AuthClientFactory";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { HeliconeUser } from "../../auth/types";
import { Result } from "../../result";

export async function supabaseAuthClientFromSSRContext(
  ctx: SSRContext<any, any, any>
): Promise<any> {
  throw new Error("useSupabaseAuthClient is not implemented");
}

export class SupabaseAuthClient implements HeliconeAuthClient {
  constructor(supabaseClient?: any, user?: any) {
    throw new Error("useSupabaseAuthClient is not implemented");
  }

  async signOut(): Promise<void> {
    throw new Error("useSupabaseAuthClient is not implemented");
  }

  async getUser(): Promise<Result<HeliconeUser, string>> {
    throw new Error("useSupabaseAuthClient is not implemented");
  }

  async refreshSession(): Promise<void> {
    throw new Error("useSupabaseAuthClient is not implemented");
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
    throw new Error("useSupabaseAuthClient is not implemented");
  }

  async resetPassword({
    email,
    options,
  }: {
    email: string;
    options?: { emailRedirectTo?: string };
  }): Promise<Result<void, string>> {
    throw new Error("useSupabaseAuthClient is not implemented");
  }

  async signInWithPassword({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<Result<HeliconeUser, string>> {
    throw new Error("useSupabaseAuthClient is not implemented");
  }

  async signInWithOAuth({
    provider,
    options,
  }: {
    provider: "google" | "github";
    options?: { redirectTo?: string };
  }): Promise<Result<void, string>> {
    throw new Error("useSupabaseAuthClient is not implemented");
  }

  async updateUser({
    password,
  }: {
    password: string;
  }): Promise<Result<void, string>> {
    throw new Error("useSupabaseAuthClient is not implemented");
  }
}

export function useSupabaseAuthClient(): HeliconeAuthClient {
  throw new Error("useSupabaseAuthClient is not implemented");
}
