import { useOrg } from "../../components/layout/organizationContext";
import { getJawnClient } from "./jawn";

export const useJawnClient = () => {
  const org = useOrg();
  return getJawnClient(org?.currentOrg?.id);
};
