import { useContext, createContext, ReactNode } from "react";
import { useOrgsContextManager } from "../../../services/hooks/organizations";
import { OrgContextValue } from "./OrgContextValue";

const OrgContext = createContext<OrgContextValue | null>(null);

// const useOrgsContextManager2 = () => {
//   console.log("useOrgsContextManager2");
//   return "hello";
// };

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
