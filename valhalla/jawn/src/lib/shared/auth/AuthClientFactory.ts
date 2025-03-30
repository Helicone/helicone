import { HeliconeAuthClient } from "./HeliconeAuthClient";
import { SupabaseAuthWrapper } from "./supabaseAuthWrapper";

export function getHeliconeAuthClient(): HeliconeAuthClient {
  const authClient = new SupabaseAuthWrapper();
  return authClient;
}
