import { supabaseServer } from "../db/supabase";

export async function getGovernanceOrgs() {
  return supabaseServer.client
    .from("organization")
    .select("*")
    .not("governance_settings", "is", null);
}
