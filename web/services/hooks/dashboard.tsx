import { useOrg } from "@/components/layout/org/organizationContext";
import { $JAWN_API, getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Result } from "../../packages/common/result";
import { useJawnClient } from "@/lib/clients/jawnHook";

const useGetUnauthorized = (userId: string) => {
  function getBeginningOfMonth() {
    const today = new Date();
    const firstDateOfMonth = format(today, "yyyy-MM-01");
    return firstDateOfMonth;
  }
  const org = useOrg();

  const { data: count, isLoading: isCountLoading } = $JAWN_API.useQuery(
    "post",
    "/v1/request/count/query",
    {
      body: {
        filter: {
          request_response_rmt: {
            request_created_at: {
              gte: getBeginningOfMonth(),
            },
          },
        },
      },
    },
    { refetchOnWindowFocus: false }
  );

  const checkAuthorizedByTier = () => {
    const currentTier = org?.currentOrg?.tier;

    if (currentTier === "free") {
      return Number(count?.data || 0) > 10_000;
    }

    if (currentTier === "pro") {
      return Number(count?.data || 0) > 500_000;
    }

    return false;
  };

  return {
    unauthorized: checkAuthorizedByTier(),
    isLoading: isCountLoading,
    currentTier: org?.currentOrg?.tier,
  };
};

const useGetReport = () => {
  return useQuery({
    queryKey: [`reports`],
    queryFn: async (query) => {
      const jawnClient = getJawnClient();
      const response = await jawnClient.GET("/v1/integration/type/{type}", {
        params: {
          path: {
            type: "report",
          },
        },
      });
      return response.data?.data;
    },
  });
};
export { useGetReport, useGetUnauthorized };
