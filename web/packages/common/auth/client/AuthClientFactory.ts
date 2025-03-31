import { useSupabaseAuthClient } from "../../toImplement/client/useSupabaseAuthClient";
import { HeliconeAuthClient } from "./HeliconeAuthClient";

/**
 * Use the auth client in a React component
 * @returns The auth client
 */
export function useHeliconeAuthClient(): HeliconeAuthClient {
  return useSupabaseAuthClient();
}
