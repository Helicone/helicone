import { SupabaseClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { PropertyParam } from "../../lib/api/properties/propertyParams";
import { Result } from "../../lib/shared/result";

const getPropertyParams = async (property: string, search: string) => {
  const resp = await axios.get(
    `/api/properties/${property}/params?search=${search}`
  );
  return resp.data as Result<PropertyParam[], string>;
};

export { getPropertyParams };
