import { createAuthClient } from "better-auth/react";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { HeliconeOrg, HeliconeUser } from "../../auth/types";
import { err, ok, Result } from "../../result";

export const authClient = createAuthClient();

// Helper: Ensure user exists in Better Auth
async function ensureUserInBetterAuth(email: string, password: string): Promise<boolean> {
  // For Better Auth, we would typically use the signUp API to create the user
  // Since we're in the sign-in flow, we'll try to create the user using Better Auth's signUp
  try {
    const result: any = await authClient.signUp.email({
      email,
      password,
      name: "",
    });
    
    if (result.data) {
      return true;
    }
    
    // If signUp fails because user already exists, that's also fine
    if (result.error && result.error.message && result.error.message.includes('already exists')) {
      return true;
    }
    
    // Handle 422 error (user exists in Better Auth but not as credential)
    if (result.error && result.error.status === 422) {
      console.log('Sign-up failed: user already exists in Better Auth, but no credential. Prompt for password reset.');
      return false;
    }
    
    return false;
  } catch (error) {
    console.error('Error creating user in Better Auth:', error);
    return false;
  }
}

export const heliconeAuthClientFromSession = (
  session: ReturnType<typeof authClient.useSession>["data"],
  refetch: () => void,
  org?: { org: HeliconeOrg; role: string },
  dbUser?: HeliconeUser,
): HeliconeAuthClient => {
  const sessionData = session ?? null;
  const betterAuthUser = sessionData?.user ?? null;

  const user = betterAuthUser?.id
    ? {
        id: betterAuthUser?.id ?? "",
        email: betterAuthUser?.email ?? "",
      }
    : undefined;
  // Map Better Auth user to HeliconeUserobject is memoized with correct dependencies
  return {
    user,

    async signOut() {
      try {
        await authClient.signOut();
      } catch (error: any) {
        console.error("Better Auth sign out error:", error);
      }
    },

    async getUser(): Promise<Result<HeliconeUser, string>> {
      if (dbUser) {
        return ok(dbUser);
      }
      if (!user) {
        return err("User not found");
      }
      return ok(user);
    },

    async getOrg(): Promise<
      Result<{ org: HeliconeOrg; role: string }, string>
    > {
      if (!org) {
        return err("Org not found");
      }
      return ok(org);
    },

    async refreshSession(): Promise<void> {
      refetch();
    },

    async signUp(params): Promise<Result<HeliconeUser, string>> {
      try {
        console.log("sign up params", params);
        const result: any = await authClient.signUp.email({
          email: params.email,
          password: params.password,
          name: "",
        });
        console.log("sign up result", result);
        if (result.data) {
          return ok({
            id: result.data.user.id,
            email: result.data.user.email ?? "",
          });
        }

        return err("Signup process outcome unclear. Check verification steps.");
      } catch (error: any) {
        console.error("Better Auth sign up error:", error);
        return err(error.message || "Sign up failed");
      }
    },

    async signInWithPassword(params): Promise<Result<HeliconeUser, string>> {
      try {
        const result: any = await authClient.signIn.email({
          email: params.email,
          password: params.password,
        });
        if (result.data) {
          const user = {
            id: result.data.user.id,
            email: result.data.user.email ?? "",
          };
          return ok(user);
        } else if (result.error) {
          try {
            const ensured = await ensureUserInBetterAuth(params.email, params.password);
            if (ensured) {
              // Retry sign-in
              const retry: any = await authClient.signIn.email({
                email: params.email,
                password: params.password,
              });
              if (retry.data) {
                const user = {
                  id: retry.data.user.id,
                  email: retry.data.user.email ?? "",
                };
                return ok(user);
              }
              // If the retry fails with 401 or 422, show the custom error
              if (retry.error && (retry.error.status === 401 || retry.error.status === 422)) {
                return err("Account exists but cannot be signed in with email/password. Please reset your password or contact support.");
              }
              return err(retry.error?.message || "Sign in failed after provisioning");
            }
            // If auto-provisioning failed due to 422, suggest password reset
            return err("Account exists but cannot be signed in with email/password. Please reset your password or contact support.");
          } catch (provisionErr: any) {
            return err(provisionErr?.message || "Auto-provisioning failed");
          }
        }
        return err(result.error?.message || "Sign in failed");
      } catch (error: any) {
        return err(error.message || "Sign in failed");
      }
    },

    async signInWithOAuth(params): Promise<Result<void, string>> {
      throw new Error("Not implemented");
    },

    async resetPassword(params): Promise<Result<void, string>> {
      throw new Error("Not implemented");
    },

    async updateUser(params): Promise<Result<void, string>> {
      throw new Error("Not implemented");
    },
  };
};
