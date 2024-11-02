import { getJawnClient } from "../../../../../../lib/clients/jawn";
import { placeAssetIdValues } from "../../../../../../services/lib/requestTraverseHelper";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type ExperimentTable = {
  id: string;
  name: string;
  experimentId: string;
  metadata: Record<string, any>;
  columns: Column[];
};

export type Column = {
  id: string;
  cells: Cell[];
  metadata: Record<string, any>;
  columnName: string;
  columnType: ColumnType;
};

export type Cell = {
  id: string;
  value: string;
  status: CellStatus;
  metadata: Record<string, any>;
  rowIndex: number;
};

export type TableCell = {
  value: string | any | null;
  cellId: string;
  status: CellStatus;
};

export type TableRow = {
  id: string;
  rowIndex: number;
  isLoading: Record<string, boolean>;
  cells: Record<string, TableCell>; // columnId -> TableCell
};

type ColumnType = "input" | "output" | "experiment";
type CellStatus = "initialized" | "success" | "running";

export const getRequestDataByIds = async (
  orgId: string,
  requestIds: string[]
) => {
  const jawnClient = getJawnClient(orgId);
  const res = await jawnClient.POST("/v1/request/query-ids", {
    body: { requestIds },
  });
  return res.data?.data ?? [];
};

export const fetchRequestResponseBody = async (request_response: any) => {
  if (!request_response.signed_body_url) return null;
  try {
    const contentResponse = await fetch(request_response.signed_body_url);
    if (contentResponse.ok) {
      const text = await contentResponse.text();
      let content = JSON.parse(text);
      if (request_response.asset_urls) {
        content = placeAssetIdValues(request_response.asset_urls, content);
      }
      return content;
    }
  } catch (error) {
    console.error("Error fetching response body:", error);
  }
  return null;
};

// Add a new query key constant
const CELL_RESPONSE_CACHE_KEY = "cellResponseCache";

export async function getTableData({
  experimentTableData,
  responseBodyCache,
  getRequestDataByIds,
  queryClient,
}: {
  experimentTableData: ExperimentTable | null;
  responseBodyCache: Record<string, any>;
  getRequestDataByIds: (requestIds: string[]) => Promise<any[]>;
  queryClient: QueryClient;
}): Promise<TableRow[]> {
  if (!experimentTableData) {
    return [];
  }

  const rowIndexToRow = new Map<number, TableRow>();

  await Promise.all(
    experimentTableData.columns.map(async (column) => {
      const columnId = column.id;
      await Promise.all(
        column.cells.map(async (cell) => {
          const rowIndex = cell.rowIndex;
          let row = rowIndexToRow.get(rowIndex);
          if (!row) {
            const newRow: TableRow = {
              id: `row-${rowIndex}`,
              rowIndex,
              isLoading: {},
              cells: {},
            };
            rowIndexToRow.set(rowIndex, newRow);
            row = newRow;
          }

          if (cell.value !== undefined && cell.value !== null) {
            if (
              (cell.metadata?.cellType === "output" ||
                cell.metadata?.cellType === "experiment") &&
              (cell.status === "initialized" || cell.status === "success")
            ) {
              // Check cache first
              const cacheKey = [CELL_RESPONSE_CACHE_KEY, cell.value];
              let responseBody = queryClient.getQueryData(cacheKey);

              if (!responseBody) {
                const requestDataArray = await getRequestDataByIds([
                  cell.value,
                ]);
                if (requestDataArray && requestDataArray.length > 0) {
                  responseBody = await fetchRequestResponseBody(
                    requestDataArray[0]
                  );
                  // Cache the response
                  queryClient.setQueryData(cacheKey, responseBody);
                }
              }

              row.cells[columnId] = {
                cellId: cell.id,
                value: responseBody,
                status: cell.status,
              };
            } else {
              row.cells[columnId] = {
                cellId: cell.id,
                value: cell.value,
                status: cell.status,
              };
            }
          } else {
            row.cells[columnId] = {
              cellId: cell.id,
              value: null,
              status: cell.status,
            };
          }
        })
      );
    })
  );

  return Array.from(rowIndexToRow.values()).sort(
    (a, b) => a.rowIndex - b.rowIndex
  );
}

export function useExperimentTable(orgId: string, experimentTableId: string) {
  const queryClient = useQueryClient();
  const {
    data: experimentTableQuery,

    isLoading: isExperimentTableLoading,
  } = useQuery(
    ["experimentTable", orgId, experimentTableId],
    async () => {
      if (!orgId || !experimentTableId) return null;
      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.POST(
        "/v1/experiment/table/{experimentTableId}/query",
        {
          params: {
            path: {
              experimentTableId: experimentTableId,
            },
          },
        }
      );
      const rowData = await getTableData({
        experimentTableData: res.data?.data as ExperimentTable,
        getRequestDataByIds: (requestIds) =>
          getRequestDataByIds(orgId, requestIds),
        responseBodyCache: {},
        queryClient,
      });
      return {
        id: res.data?.data?.id,
        name: res.data?.data?.name,
        experimentId: res.data?.data?.experimentId,
        promptSubversionId: res.data?.data?.metadata?.prompt_version as string,
        datasetId: res.data?.data?.metadata?.datasetId as string,
        metadata: res.data?.data?.metadata,
        columns: res.data?.data?.columns,
        rows: rowData,
      };
    },
    {
      // Add polling configuration
      refetchInterval: (data) => {
        // Check if any cells are in "running" status
        const hasRunningCells = data?.rows?.some((row) =>
          Object.values(row.cells).some((cell) => cell.status === "running")
        );

        // Refetch every 3 seconds if there are running cells, otherwise stop polling
        return hasRunningCells ? 3000 : false;
      },
      // Continue polling even when the window loses focus
      refetchIntervalInBackground: true,
    }
  );

  const addExperimentTableColumn = useMutation({
    mutationFn: async ({
      columnName,
      columnType,
      hypothesisId,
      promptVersionId,
    }: {
      columnName: string;
      columnType: string;
      hypothesisId?: string;
      promptVersionId?: string;
    }) => {
      const jawnClient = getJawnClient(orgId);
      await jawnClient.POST("/v1/experiment/table/{experimentTableId}/column", {
        params: {
          path: { experimentTableId: experimentTableId || "" },
        },
        body: {
          columnName,
          columnType,
          hypothesisId,
          promptVersionId,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
    },
  });

  const addExperimentTableRow = useMutation({
    mutationFn: async ({
      promptVersionId,
      inputs,
    }: {
      promptVersionId: string;
      inputs?: Record<string, string>;
    }) => {
      const jawnClient = getJawnClient(orgId);
      await jawnClient.POST(
        "/v1/experiment/table/{experimentTableId}/row/new",
        {
          params: { path: { experimentTableId: experimentTableId } },
          body: { promptVersionId, inputs },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
    },
  });

  const addExperimentTableRowInsertBatch = useMutation({
    mutationFn: async ({
      rows,
    }: {
      rows: {
        inputRecordId: string;
        datasetId: string;
        inputs: Record<string, string>;
        cells: {
          columnId: string;
          value: string | null;
        }[];
      }[];
    }) => {
      const jawnClient = getJawnClient(orgId);
      await jawnClient.POST(
        "/v1/experiment/table/{experimentTableId}/row/insert/batch",
        {
          params: { path: { experimentTableId: experimentTableId } },
          body: { rows },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
    },
  });

  const updateExperimentCell = useMutation({
    mutationFn: async ({
      cellId,
      status = "initialized",
      value,
      metadata,
    }: {
      cellId: string;
      status?: string;
      value: string;
      metadata?: Record<string, any>;
    }) => {
      const jawnClient = getJawnClient(orgId);
      await jawnClient.PATCH("/v1/experiment/table/{experimentTableId}/cell", {
        params: { path: { experimentTableId: experimentTableId } },
        body: { cellId, status, value, metadata, updateInputs: true },
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific cell cache if it's a UUID
      if (
        variables.metadata?.cellType === "output" ||
        variables.metadata?.cellType === "experiment"
      ) {
        queryClient.invalidateQueries([
          CELL_RESPONSE_CACHE_KEY,
          variables.value,
        ]);
      }
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
    },
  });

  const runHypothesisMutation = useMutation({
    mutationFn: async ({
      hypothesisId,
      cells,
    }: {
      hypothesisId: string;
      cells: Array<{
        cellId: string;
      }>;
    }) => {
      const jawnClient = getJawnClient(orgId || "");
      await jawnClient.POST("/v1/experiment/run", {
        body: {
          experimentTableId,
          hypothesisId,
          cells,
        },
      });
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
    },
  });

  const promptSubversionId = experimentTableQuery?.promptSubversionId;

  const { data: promptVersionTemplateData } = useQuery(
    ["promptVersionTemplate", promptSubversionId],
    async () => {
      if (!orgId || !promptSubversionId) {
        return null;
      }
      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
        params: {
          path: {
            promptVersionId: promptSubversionId,
          },
        },
      });
      return res.data?.data;
    },
    {
      enabled: !!promptSubversionId,
    }
  );

  return {
    experimentTableQuery,
    isExperimentTableLoading,
    promptVersionTemplateData,
    addExperimentTableColumn,
    addExperimentTableRow,
    updateExperimentCell,
    runHypothesisMutation,
    addExperimentTableRowInsertBatch,
  };
}
