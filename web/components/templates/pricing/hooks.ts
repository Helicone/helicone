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

export const useCostForEvals = () => {
  const org = useOrg();
  return useQuery({
    queryKey: ["cost-for-evals"],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.GET("/v1/stripe/subscription/cost-for-evals");
      return result;
    },
  });
};

export const useCostForExperiments = () => {
  const org = useOrg();
  return useQuery({
    queryKey: ["cost-for-experiments"],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const result = await jawn.GET(
        "/v1/stripe/subscription/cost-for-experiments"
      );
      return result;
    },
  });
};
