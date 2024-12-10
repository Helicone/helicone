import { Database } from "@/supabase/database.types";

export interface OrgContextValue {
  currentOrg?: Database["public"]["Tables"]["organization"]["Row"];
  allOrgs: Database["public"]["Tables"]["organization"]["Row"][];
  refreshCurrentOrg: () => void;
  setCurrentOrg: (
    orgId: Database["public"]["Tables"]["organization"]["Row"]["id"]
  ) => void;
  refetchOrgs: () => void;
  // Add to elements you want to re-render when the org changes
  renderKey: number;
  isResellerOfCurrentCustomerOrg: boolean;
}
