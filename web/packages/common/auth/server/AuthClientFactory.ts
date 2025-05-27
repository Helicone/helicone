import { getEnv } from "../../toImplement/helpers/getEnv";
import { BetterAuthWrapper } from "../../toImplement/server/BetterAuthWrapper";
import { SupabaseAuthWrapper } from "../../toImplement/server/SupabaseAuthWrapper";
import { HeliconeAuthClient } from "./HeliconeAuthClient";

export function getHeliconeAuthClient(): HeliconeAuthClient {
  if (getEnv("NEXT_PUBLIC_BETTER_AUTH") === "true") {
    return new BetterAuthWrapper();
  }
  return new SupabaseAuthWrapper();
}
