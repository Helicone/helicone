import { SupabaseAuthWrapper } from "../../toImplement/server/SupabaseAuthWrapper";
import { HeliconeAuthClient } from "./HeliconeAuthClient";

export function getHeliconeAuthClient(): HeliconeAuthClient {
  return new SupabaseAuthWrapper();
}
