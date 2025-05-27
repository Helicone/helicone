import { useBetterAuthClient } from "../../toImplement/client/useBetterAuthClient";
import { useSupabaseAuthClient } from "../../toImplement/client/useSupabaseAuthClient";
import { getEnv } from "../../toImplement/helpers/getEnv";

/**
 * Use the auth client in a React component
 * @returns The auth client
 */
export const useHeliconeAuthClient =
  getEnv("NEXT_PUBLIC_BETTER_AUTH") === "true"
    ? useBetterAuthClient
    : useSupabaseAuthClient;
