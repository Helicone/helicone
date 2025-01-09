import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";

export const useIsGovernanceEnabled = () => {
  const org = useOrg();
  return useQuery({
    queryKey: ["is-governance-enabled", org?.currentOrg?.id],
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET("/v1/gov-organization/is-governance-org");
    },
  });
};

export const useGovernanceLimits = (memberId: string) => {
  const org = useOrg();
  const queryClient = useQueryClient();

  const memberLimits = useQuery({
    queryKey: ["governance-limits", org?.currentOrg?.id, memberId],
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.GET("/v1/gov-organization/limits/member/{memberId}", {
        params: {
          path: {
            memberId: memberId,
          },
        },
      });
    },
  });

  const changeMemberLimits = useMutation({
    mutationFn: (body: { limitUSD: number; days: number }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      return jawn.POST("/v1/gov-organization/limits/member/{memberId}", {
        body: {
          limitUSD: body.limitUSD,
          days: body.days,
        },
        params: {
          path: {
            memberId: memberId,
          },
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["governance-limits", org?.currentOrg?.id, memberId],
      });
      memberLimits.refetch();
    },
  });

  const isGovernanceEnabled = useIsGovernanceEnabled();

  return {
    memberLimits,
    changeMemberLimits,
    isGovernanceEnabled,
  };
};
