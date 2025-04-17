import { env } from "next-runtime-env";
import { useBetterAuthClient } from "../../toImplement/client/useBetterAuthClient";
import { useSupabaseAuthClient } from "../../toImplement/client/useSupabaseAuthClient";

/**
 * Use the auth client in a React component
 * @returns The auth client
 */
export const useHeliconeAuthClient =
  env("NEXT_PUBLIC_BETTER_AUTH") === "true"
    ? useBetterAuthClient
    : useSupabaseAuthClient;
