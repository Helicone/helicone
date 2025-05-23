import { createAuthClient } from "better-auth/react";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { HeliconeOrg, HeliconeUser } from "../../auth/types";
import { err, ok, Result } from "../../result";

export const authClient = createAuthClient();
export const heliconeAuthClientFromSession = (
  session: ReturnType<typeof authClient.useSession>["data"],
  refetch: () => void,
  org?: { org: HeliconeOrg; role: string }
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
        const result = await authClient.signUp.email({
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
        const result = await authClient.signIn.email({
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
          return err(result.error.message || "Sign in failed");
        }
        return err("Sign in failed");
      } catch (error: any) {
        console.error("Better Auth password sign in error:", error);
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
