import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useOrg } from "../../../components/layout/org/organizationContext";
import { getJawnClient } from "../../../lib/clients/jawn";
import { toast } from "sonner";
import { logger } from "@/lib/telemetry/logger";

const fetchHeliconeDatasetRows = async (
  orgId: string,
  datasetId: string,
  page: number,
  pageSize: number,
) => {
  const jawn = getJawnClient(orgId);
  const response = await jawn.POST(`/v1/helicone-dataset/{datasetId}/query`, {
    body: {
      limit: pageSize,
      offset: (page - 1) * pageSize,
    },
    params: {
      path: {
        datasetId,
      },
    },
  });

  const rows = response.data?.data ?? [];

  // Fetch request and response bodies
  const rowsWithBodies = await Promise.all(
    rows.map(async (row) => {
      let request_body = "";
      let response_body = "";

      if (row.signed_url) {
        if (row.signed_url.error && row.signed_url.data) {
          const content = (row.signed_url as any).data as {
            request?: string;
            response?: string;
          };
          request_body = content?.request ?? "";
          response_body = content?.response ?? "";
        } else {
          try {
            const response = await fetch(row.signed_url.data!);
            const content = await response.json();
            request_body = content?.request ?? "";
            response_body = content?.response ?? "";
          } catch (error) {
            logger.error({ error }, "Error fetching signed URL");
          }
        }
      }

      return {
        ...row,
        request_body,
        response_body,
      };
    }),
  );

  return rowsWithBodies;
};

const useGetHeliconeDatasets = (datasetIds?: string[]) => {
  const org = useOrg();

  const hasValidDatasetIds = datasetIds && datasetIds.length > 0;

  const { data, isLoading, refetch, isRefetching, status, isFetched } =
    useQuery({
      queryKey: ["helicone-datasets", org?.currentOrg?.id, datasetIds],
      queryFn: async (query) => {
        const orgId = query.queryKey[1] as string;
        const jawn = getJawnClient(orgId);

        return jawn.POST("/v1/helicone-dataset/query", {
          body: hasValidDatasetIds ? { datasetIds } : {},
        });
      },
      enabled: !!org?.currentOrg?.id,
      refetchOnWindowFocus: false,
    });

  return {
    isLoading,
    refetch,
    isRefetching,
    status,
    isFetched,
    // True when data has been fetched AND exists
    hasData: isFetched && !!data?.data?.data?.length,
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

const useGetHeliconeDatasetRows = (
  id: string,
  currentPage: number,
  currentPageSize: number,
) => {
  const org = useOrg();
  const [rows, setRows] = useState<any[]>([]);

  const {
    data,
    isLoading,
    refetch: originalRefetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      "dataset",
      org?.currentOrg?.id,
      id,
      currentPage,
      currentPageSize,
    ],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const datasetId = query.queryKey[2] as string;
      const jawn = getJawnClient(orgId);
      return jawn.POST(`/v1/helicone-dataset/{datasetId}/query`, {
        body: {
          limit: currentPageSize,
          offset: (currentPage - 1) * currentPageSize,
        },
        params: {
          path: {
            datasetId,
          },
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  const {
    data: countData,
    isLoading: isCountLoading,
    refetch: refetchCount,
  } = useQuery({
    queryKey: ["datasetCount", org?.currentOrg?.id, id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const datasetId = query.queryKey[2] as string;
      const jawn = getJawnClient(orgId);
      return jawn.POST(`/v1/helicone-dataset/{datasetId}/count`, {
        params: {
          path: {
            datasetId,
          },
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  const rowsWithSignedUrls = useMemo(() => data?.data?.data ?? [], [data]);

  useEffect(() => {
    if (rowsWithSignedUrls.length > 0) {
      setRows(rowsWithSignedUrls);
    }
  }, [rowsWithSignedUrls]);

  const urlQueries = useQueries({
    queries: rowsWithSignedUrls.map((row) => ({
      queryKey: ["row-content", row.id],
      queryFn: async () => {
        if (row.signed_url?.error) {
          return row.signed_url.data;
        }
        if (row.signed_url?.data) {
          const response = await fetch(row.signed_url.data);
          return response.json();
        }
        return null;
      },
      enabled: !!row.signed_url,
    })),
  });

  useEffect(() => {
    if (rows.length === 0) return;

    urlQueries.forEach((query, index) => {
      if (query.isSuccess && query.data) {
        const rowId = rowsWithSignedUrls[index]?.id;
        if (!rowId) return;

        setRows((currentRows) => {
          const rowIndex = currentRows.findIndex((r) => r.id === rowId);
          if (rowIndex === -1 || currentRows[rowIndex].request_response_body) {
            return currentRows;
          }

          const newRows = [...currentRows];
          newRows[rowIndex] = {
            ...newRows[rowIndex],
            request_response_body: query.data,
          };
          return newRows;
        });
      }
    });
  }, [urlQueries, rows, rowsWithSignedUrls]);

  const isUrlsFetching = urlQueries.some((query) => query.isFetching);

  // Custom refetch function
  const refetch = async () => {
    const result = await originalRefetch();
    if (result.data?.data?.data) {
      setRows(result.data.data.data);
    }
    await refetchCount(); // Refetch the count when rows are refetched
    return result;
  };

  return {
    isLoading: isLoading || isUrlsFetching,
    refetch,
    isRefetching: isRefetching || isUrlsFetching,
    rows: rows.map((r) => ({
      ...r,
      request_body: r.request_response_body?.request || "",
      response_body: r.request_response_body?.response || "",
    })),
    completedQueries: urlQueries.filter((query) => query.isSuccess).length,
    totalQueries: rowsWithSignedUrls.length,
    count: countData?.data?.data ?? 0,
    isCountLoading,
  };
};

const useGetHeliconeDatasetCount = (id: string) => {
  const org = useOrg();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dataset-count", org?.currentOrg?.id, id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const datasetId = query.queryKey[2] as string;
      const jawn = getJawnClient(orgId);
      return jawn.POST(`/v1/helicone-dataset/{datasetId}/count`, {
        params: {
          path: {
            datasetId,
          },
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  return {
    isLoading,
    refetch,
    isRefetching,
    count: data?.data?.data,
  };
};

const useDeleteHeliconeDataset = () => {
  const org = useOrg();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (datasetId: string) => {
      const orgId = org?.currentOrg?.id as string;
      const jawn = getJawnClient(orgId);
      const response = await jawn.POST(
        `/v1/helicone-dataset/{datasetId}/delete`,
        {
          params: {
            path: {
              datasetId,
            },
          },
        },
      );

      if (!response.data) {
        throw new Error("Failed to delete dataset");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["helicone-datasets"] });
      toast.success("Dataset deleted successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to delete dataset: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    },
  });
};

export {
  useGetHeliconeDatasets,
  useGetHeliconeDatasetRows,
  useGetHeliconeDatasetCount,
  useDeleteHeliconeDataset,
  fetchHeliconeDatasetRows,
};
