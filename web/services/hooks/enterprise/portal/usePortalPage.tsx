import { $JAWN_API } from "@/lib/clients/jawn";
import { useOrg } from "../../../../components/layout/org/organizationContext";

const usePortalPage = () => {
  const org = useOrg();

  return $JAWN_API.useQuery("get", "/v1/organization/reseller/{resellerId}", {
    params: {
      path: {
        resellerId: org?.currentOrg?.id ?? "",
      },
    },
  });
};

export default usePortalPage;
