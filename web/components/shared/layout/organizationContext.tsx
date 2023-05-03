import React, { useContext } from "react";
import { Database } from "../../../supabase/database.types";

const OrgContext = React.createContext<
  Database["public"]["Tables"]["organization"]["Row"] | null
>(null);

export const useOrg = () => useContext(OrgContext);
export default OrgContext;
