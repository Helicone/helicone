import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { PropertyParam } from "../../lib/api/properties/propertyParams";
import { Result } from "../../lib/result";

const getPropertyParams = async () => {
  const resp = await axios.get("/api/properties/params");
  return resp.data as Result<PropertyParam[], string>;
};

export { getPropertyParams };
