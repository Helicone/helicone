import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { PropertyParam } from "../../lib/api/properties/propertyParams";
import { ValueParam } from "../../lib/api/values/valueParams";
import { Result } from "../../lib/shared/result";

export const getValueParams = async () => {
  const resp = await axios.get("/api/prompt_values/params");
  return resp.data as Result<ValueParam[], string>;
};
