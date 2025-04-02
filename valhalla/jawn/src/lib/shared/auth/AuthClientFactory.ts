import { HeliconeAuthClient } from "./HeliconeAuthClient";
import { SupabaseAuthWrapper } from "./SupabaseAuthWrapper";

export function getHeliconeAuthClient(): HeliconeAuthClient {
  const authClient = new SupabaseAuthWrapper();
  return authClient;
}
