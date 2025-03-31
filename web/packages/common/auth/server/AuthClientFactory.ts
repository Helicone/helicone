import { SupabaseAuthWrapper } from "../../toImplement/server/SupabaseAuthWrapper";
import { HeliconeAuthClient } from "./HeliconeAuthClient";

export function getHeliconeAuthClient(): HeliconeAuthClient {
  const authClient = new SupabaseAuthWrapper();
  return authClient;
}
