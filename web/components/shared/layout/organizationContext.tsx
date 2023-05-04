import React, { useContext } from "react";
import { Database } from "../../../supabase/database.types";
import { useOrgsContextManager } from "../../../services/hooks/organizations";

export interface OrgContextValue {
  currentOrg: Database["public"]["Tables"]["organization"]["Row"];
  allOrgs: Database["public"]["Tables"]["organization"]["Row"][];
  setCurrentOrg: (
    orgId: Database["public"]["Tables"]["organization"]["Row"]["id"]
  ) => void;
  refetchOrgs: () => void;
}

const OrgContext = React.createContext<OrgContextValue | null>(null);

export const OrgContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const orgContextValue = useOrgsContextManager();
  return (
    <OrgContext.Provider value={orgContextValue}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => useContext(OrgContext);
export default OrgContext;
