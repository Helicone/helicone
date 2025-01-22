import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";

export const useCostForPrompts = () => {
  const org = useOrg();
  return useQuery({
    queryKey: ["cost-for-prompts"],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.GET("/v1/stripe/subscription/cost-for-prompts");
      return result;
    },
  });
};
