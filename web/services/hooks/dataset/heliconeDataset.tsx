import { useQuery, useQueries } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useOrg } from "../../../components/layout/organizationContext";
import { getJawnClient } from "../../../lib/clients/jawn";

const useGetHeliconeDatasets = (datasetIds?: string[]) => {
  const org = useOrg();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["helicone-datasets", org?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const jawn = getJawnClient(orgId);
      return jawn.POST("/v1/helicone-dataset/query", {
        body: {
          datasetIds,
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading: isLoading,
    refetch,
    isRefetching: isRefetching,
    datasets:
      data?.data?.data?.map((dataset) => ({
        ...dataset,
        promptVersionId: dataset.meta?.["promptVersionId"],
      })) ?? [],
  };
};

type NotUndefined<T> = T extends undefined ? never : T;
type NotNull<T> = T extends null ? never : T;
type NotNullAndUndefined<T> = NotNull<NotUndefined<T>>;

const useGetHeliconeDatasetRows = (id: string) => {
  const org = useOrg();
  type Rows = (NotNullAndUndefined<
    NotNullAndUndefined<NotNullAndUndefined<typeof data>["data"]>["data"]
  >[number] & {
    request_response_body?: any;
  })[];
  const [rows, setRows] = useState<Rows>([]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dataset", org?.currentOrg?.id, id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const datasetId = query.queryKey[2] as string;
      const jawn = getJawnClient(orgId);
      return jawn.POST(`/v1/helicone-dataset/{datasetId}/query`, {
        body: {},
        params: {
          path: {
            datasetId,
          },
        },
      });
    },
  });
  data?.data;

  const rowsWithSignedUrls = useMemo(() => data?.data?.data ?? [], [data]);

  const urlQueries = useQueries({
    queries: rowsWithSignedUrls.map((row, index: number) => ({
      queryKey: ["row-content", row.signed_url],
      queryFn: () =>
        row.signed_url.error
          ? Promise.resolve(row.signed_url.data)
          : fetch(row.signed_url.data!).then((res) => res.json()),
      enabled: !!row.signed_url,
      onSuccess: (content: any) => {
        setRows((prev) => {
          const newRows = [...prev];
          newRows[index] = {
            ...newRows[index],
            request_response_body: content,
          };
          return newRows;
        });
      },
    })),
  });

  useEffect(() => {
    if (rowsWithSignedUrls.length > 0) {
      setRows(rowsWithSignedUrls);
    }
  }, [rowsWithSignedUrls]);

  const isUrlsFetching = urlQueries.some((query) => query.isFetching);

  return {
    isLoading: isLoading || isUrlsFetching,
    refetch,
    isRefetching: isRefetching || isUrlsFetching,
    rows: rows.map((r) => ({
      ...r,
      request_body: r.request_response_body?.request,
      response_body: r.request_response_body?.response,
    })),
    completedQueries: urlQueries.filter((query) => query.isSuccess).length,
    totalQueries: rowsWithSignedUrls.length,
  };
};

export { useGetHeliconeDatasets, useGetHeliconeDatasetRows };
