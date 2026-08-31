import { useOrg } from "@/components/layout/org/organizationContext";
import { $JAWN_API } from "@/lib/clients/jawn";

export const useBillingUsage = () => {
  const org = useOrg();

  return $JAWN_API.useQuery(
    "get",
    "/v1/stripe/subscription/usage-stats",
    {},
    {
      enabled: !!org?.currentOrg?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );
};
