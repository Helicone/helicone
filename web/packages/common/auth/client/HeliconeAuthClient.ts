import { HeliconeOrg, HeliconeUser } from "../types";
import { Result } from "../../result";
export interface HeliconeAuthClient {
  signOut: () => Promise<void>;
  user?: HeliconeUser;
  refreshSession: () => Promise<void>;
  signUp: ({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { emailRedirectTo?: string };
  }) => Promise<Result<HeliconeUser, string>>;

  getOrg: () => Promise<
    Result<
      {
        org: HeliconeOrg;
        role: string;
      },
      string
    >
  >;

  resetPassword: ({
    email,
    options,
  }: {
    email: string;
    options?: { emailRedirectTo?: string };
  }) => Promise<Result<void, string>>;

  changePassword: ({
    currentPassword,
    newPassword,
  }: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<Result<void, string>>;

  signInWithPassword: ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => Promise<Result<HeliconeUser, string>>;

  signInWithOAuth: ({
    provider,
    options,
  }: {
    provider: "google" | "github";
    options?: { redirectTo?: string };
  }) => Promise<Result<void, string>>;

  updateUser: ({
    password,
  }: {
    password: string;
  }) => Promise<Result<void, string>>;

  getUser: () => Promise<Result<HeliconeUser, string>>;
}
