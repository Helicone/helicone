import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Result } from "../../lib/result";

const useGetUnauthorized = (userId: string) => {
  function getBeginningOfMonth() {
    const today = new Date();
    const firstDateOfMonth = format(today, "yyyy-MM-01");
    return firstDateOfMonth;
  }
  const org = useOrg();

  const { data: count, isLoading: isCountLoading } = useQuery({
    queryKey: [`requestCount`],
    queryFn: async (query) => {
      const data = await fetch(`/api/request/ch/count`, {
        method: "POST",
        body: JSON.stringify({
          filter: {
            left: {
              request_response_rmt: {
                request_created_at: {
                  gte: getBeginningOfMonth(),
                },
              },
            },
            operator: "and",
            right: "all",
          },
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json() as Promise<Result<number, string>>);
      return data;
    },
    refetchOnWindowFocus: false,
  });

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
