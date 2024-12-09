import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../../components/layout/org/organizationContext";
import { getJawnClient } from "../../lib/clients/jawn";

const useJawnSettings = () => {
  const org = useOrg();
  return useQuery({
    queryKey: ["jawn_settings", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);

      return jawn.GET("/v1/settings/query");
    },
    refetchOnWindowFocus: false,
  });
};

export { useJawnSettings };
