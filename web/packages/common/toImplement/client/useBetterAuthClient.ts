import { useMemo } from "react";
import { createAuthClient } from "better-auth/react";
import { HeliconeAuthClient } from "../../auth/client/HeliconeAuthClient";
import { HeliconeUser, HeliconeOrg } from "../../auth/types";
import { err, ok, Result } from "../../result";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";

// Type guard to check if the result is a success with user data
function isSuccessResultWithUser(
  result: any
): result is { user: { id: string; email?: string | null } } {
  if (
    result &&
    typeof result === "object" &&
    result.user &&
    typeof result.user.id === "string"
  ) {
    return true;
  }
  return false; // Explicitly return false
}

// Type guard to check for error result
function isErrorResult(result: any): result is { error: { message: string } } {
  return (
    result &&
    typeof result === "object" &&
    result.error &&
    typeof result.error.message === "string"
  );
}

// Hook to provide HeliconeAuthClient interface using Better Auth
export function useBetterAuthClient(): HeliconeAuthClient {
  // Call useSession unconditionally at the top level
  const authClient = createAuthClient();
  const session = authClient.useSession();

  // Safely access properties
  const isLoadingSession = session.isPending ?? true;
  const sessionData = session.data ?? null;
  const betterAuthUser = sessionData?.user ?? null;
  const sessionError = session.error ?? null;

  // Log session error if present
  useMemo(() => {
    if (sessionError) {
      const message =
        typeof sessionError === "object" &&
        sessionError !== null &&
        "message" in sessionError
          ? (sessionError as { message: string }).message
          : "Unknown session error";
      console.error("Better Auth session error:", message);
    }
  }, [sessionError]);

  // Map Better Auth user to HeliconeUser
  const currentUser = useMemo(() => {
    if (
      betterAuthUser &&
      typeof betterAuthUser === "object" &&
      "id" in betterAuthUser
    ) {
      return {
        id: (betterAuthUser as { id: string }).id,
        email: (betterAuthUser as { email?: string | null }).email ?? "",
      };
    }
    return undefined;
  }, [betterAuthUser]);

  // Org fetching logic
  const orgContext = useOrg();
  const allOrgs = $JAWN_API.useQuery("get", "/v1/organization", {});

  // Ensure the implementation object is memoized with correct dependencies
  const clientImplementation = useMemo((): HeliconeAuthClient => {
    // Get current org from Jawn data based on context
    const orgWithRole = allOrgs.data?.data?.find(
      (org) => org.id === orgContext?.currentOrg?.id
    );

    return {
      user: currentUser,

      async signOut() {
        try {
          await authClient.signOut();
        } catch (error: any) {
          console.error("Better Auth sign out error:", error);
        }
      },

      async getUser(): Promise<Result<HeliconeUser, string>> {
        if (isLoadingSession) {
          return err("Session loading...");
        }
        if (sessionError) {
          const message =
            typeof sessionError === "object" &&
            sessionError !== null &&
            "message" in sessionError
              ? (sessionError as { message: string }).message
              : "Unknown error";
          return err(`Session error: ${message}`);
        }
        return currentUser ? ok(currentUser) : err("User not logged in");
      },

      async getOrg(): Promise<
        Result<{ org: HeliconeOrg; role: string }, string>
      > {
        if (!currentUser) {
          return err("User not authenticated");
        }
        if (!orgWithRole) {
          // Use optional chaining for safer access
          const orgId = orgContext?.currentOrg?.id;
          return err(
            `Organization context not available (selected: ${orgId}) or user not part of selected org.`
          );
        }
        // Ensure role exists before returning
        if (!orgWithRole.role) {
          return err(`Role not found for organization ${orgWithRole.id}`);
        }
        return ok({ org: orgWithRole, role: orgWithRole.role });
      },

      async refreshSession(): Promise<void> {
        console.warn(
          "Manual refreshSession not implemented; relying on useSession reactivity."
        );
      },

      async signUp(params): Promise<Result<HeliconeUser, string>> {
        try {
          const result = await authClient.signUp.email({
            email: params.email,
            password: params.password,
            name: "",
          });
          if (
            result &&
            typeof result === "object" &&
            "id" in result &&
            typeof (result as { id: any }).id === "string"
          ) {
            return ok({
              id: (result as { id: string }).id,
              email: params.email,
            });
          } else if (isErrorResult(result)) {
            return err(result.error.message || "Sign up failed");
          }
          return err(
            "Signup process outcome unclear. Check verification steps."
          );
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
          if (isSuccessResultWithUser(result)) {
            const user = { id: result.user.id, email: result.user.email ?? "" };
            return ok(user);
          } else if (isErrorResult(result)) {
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
    // Correctly list dependencies for the main useMemo
  }, [
    allOrgs.data?.data,
    currentUser,
    orgContext?.currentOrg?.id,
    authClient,
    isLoadingSession,
    sessionError,
  ]); // Simplified dependencies slightly

  return clientImplementation;
}
