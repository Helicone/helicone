import { useContext, createContext, ReactNode } from "react";
import { Database } from "../../supabase/database.types";
import { useOrgsContextManager } from "../../services/hooks/organizations";

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

const OrgContext = createContext<OrgContextValue | null>(null);

export const OrgContextProvider = ({ children }: { children: ReactNode }) => {
  const orgContextValue = useOrgsContextManager();
  return (
    <OrgContext.Provider value={orgContextValue}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => useContext(OrgContext);
export default OrgContext;
