import { $JAWN_API } from "@/lib/clients/jawn";

const useGetOrgSlackChannels = (orgId: string) => {
  return $JAWN_API.useQuery(
    "get",
    "/v1/integration/slack/channels",
    {},
    {
      refetchOnWindowFocus: false,
    }
  );
};
const useGetOrgSlackIntegration = (orgId: string) => {
  return $JAWN_API.useQuery(
    "get",
    "/v1/integration/slack/settings",
    {},
    {
      refetchOnWindowFocus: false,
    }
  );
};
