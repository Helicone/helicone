import { SupabaseClient } from "@supabase/supabase-js";
import { Result } from "../util/results";
import { ClickhouseClientWrapper } from "../db/ClickhouseWrapper";
import { Database } from "../db/database.types";

class VolumetricManager {
  constructor(
    private clickhouseClient: ClickhouseClientWrapper,
    private supabaseClient: SupabaseClient<Database>
  ) {}
}
async function calculateUsage(): Promise<Result<string, string>> {}
