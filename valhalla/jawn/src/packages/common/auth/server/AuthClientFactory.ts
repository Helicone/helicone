import { BetterAuthWrapper } from "../../toImplement/server/BetterAuthWrapper";
import { SupabaseAuthWrapper } from "../../toImplement/server/SupabaseAuthWrapper";
import { HeliconeAuthClient } from "./HeliconeAuthClient";

export function getHeliconeAuthClient(): HeliconeAuthClient {
  if (process.env.BETTER_AUTH === "true") {
    return new BetterAuthWrapper();
  }
  return new SupabaseAuthWrapper();
}
