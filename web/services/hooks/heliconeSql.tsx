import { useOrg } from "@/components/layout/org/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const useClickhouseSchemas = () => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["helicone-sql", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;

      const jawnClient = getJawnClient(orgId);
      const result = await jawnClient.GET("/v1/helicone-sql/schema", {});
      if (result.error || result.data.error) {
        throw new Error(result.error || result.data.error || "Unknown error");
      }
      return result;
    },
    refetchOnWindowFocus: false,
    retry: 2,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });

  const memoizedData = useMemo(() => {
    return data?.data?.data || [];
  }, [data?.data?.data]);

  return {
    data: memoizedData,
    refetch,
    isLoading,
    isRefetching,
  };
};

export const useExecuteSql = (unsanitizedSql: string) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["helicone-sql", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;

      const jawnClient = getJawnClient(orgId);
      const result = await jawnClient.POST("/v1/helicone-sql/execute", {
        body: {
          sql: unsanitizedSql,
        },
      });
      if (result.error || result.data.error) {
        throw new Error(result.error || result.data.error || "Unknown error");
      }
      return result;
    },
    refetchOnWindowFocus: false,
    retry: 2,
    refetchIntervalInBackground: false,
    refetchInterval: false,
  });

  const memoizedData = useMemo(() => {
    return data?.data?.data || [];
  }, [data?.data?.data]);

  return {
    data: memoizedData,
    refetch,
    isLoading,
    isRefetching,
  };
};
