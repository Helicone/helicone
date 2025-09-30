import { $JAWN_API } from "@/lib/clients/jawn";

export interface GatewayEligibilityResponse {
  shouldShowBanner: boolean;
  reason?: string;
  monthlyRequests?: number;
  monthlyInferenceCost?: number;
  monthlyHeliconeeCost?: number;
}

export function useGatewayEligibility(orgId: string | undefined) {
  const result = $JAWN_API.useQuery(
    "get",
    "/v1/gateway/eligibility",
    {},
    {
      enabled: !!orgId,
      staleTime: 1000 * 60 * 60, // Cache for 1 hour
    }
  );

  return {
    ...result,
    data: result.data?.data,
  };
}