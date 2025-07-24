import { Database } from "@/db/database.types";

export interface OrgContextValue {
  currentOrg?: Database["public"]["Tables"]["organization"]["Row"];
  allOrgs: Database["public"]["Tables"]["organization"]["Row"][];

  setCurrentOrg: (
    orgId: Database["public"]["Tables"]["organization"]["Row"]["id"],
  ) => void;
  refetchOrgs: () => void;
}
