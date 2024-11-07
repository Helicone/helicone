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
  cells: Record<string, TableCell>; // columnId -> TableCell
  deleted?: boolean;
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

  // Collect all request IDs that need to be fetched
  const requestIdsToFetch = new Set<string>();

  // Map to store cell info by request ID
  const requestIdToCellInfo: Map<
    string,
    Array<{ rowIndex: number; columnId: string; cell: Cell }>
  > = new Map();

  // First pass: Collect request IDs and initialize rows and cells
  for (const column of experimentTableData.columns) {
    const columnId = column.id;
    for (const cell of column.cells) {
      const rowIndex = cell.rowIndex;
      let row = rowIndexToRow.get(rowIndex);
      if (!row) {
        const newRow: TableRow = {
          id: `row-${rowIndex}`,
          rowIndex,
          cells: {},
          deleted: false,
        };
        rowIndexToRow.set(rowIndex, newRow);
        row = newRow;
      }

      if (cell.metadata?.deleted === true) {
        row.deleted = true;
      }

      if (column.columnType === "input") {
        // Handle input columns (collapse into 'inputs' cell as an array)
        const inputKey = column.columnName; // Assuming columnName is the input key
        const inputValue = cell.value;

        // Initialize the 'inputs' cell if it doesn't exist
        if (!row.cells["inputs"]) {
          row.cells["inputs"] = {
            cellId: "", // Not applicable for the entire inputs cell
            value: [], // Initialize as an array
            status: cell.status,
          };
        }

        // Append the input entry to the inputs array
        const inputsArray = row.cells["inputs"].value as Array<{
          cellId: string;
          key: string;
          value: string;
        }>;

        inputsArray.push({
          cellId: cell.id,
          key: inputKey,
          value: inputValue,
        });
      } else if (cell.value !== undefined && cell.value !== null) {
        if (
          (cell.metadata?.cellType === "output" &&
            (cell.status === "initialized" || cell.status === "success")) ||
          (cell.metadata?.cellType === "experiment" &&
            cell.status === "success")
        ) {
          // Add to request IDs to fetch
          requestIdsToFetch.add(cell.value);
          // Map the request ID to cell info for later assignment
          if (!requestIdToCellInfo.has(cell.value)) {
            requestIdToCellInfo.set(cell.value, []);
          }
          requestIdToCellInfo
            .get(cell.value)
            ?.push({ rowIndex, columnId, cell });
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
    }
  }

  // Batch fetch all request data
  const requestDataArray = await getRequestDataByIds(
    Array.from(requestIdsToFetch)
  );

  // Fetch response bodies
  const responseBodies = await Promise.all(
    requestDataArray.map(async (requestData) => {
      const responseBody = await fetchRequestResponseBody(requestData);
      const cacheKey = [CELL_RESPONSE_CACHE_KEY, requestData.id];
      queryClient.setQueryData(cacheKey, responseBody);
      return { id: requestData.request_id, responseBody };
    })
  );

  // Map response bodies by request ID
  const idToResponseBody = new Map(
    responseBodies.map((item) => [item.id, item.responseBody])
  );

  // Second pass: Assign fetched data to cells
  requestIdToCellInfo.forEach((cellInfos, requestId) => {
    const responseBody = idToResponseBody.get(requestId);
    for (const cellInfo of cellInfos) {
      const { rowIndex, columnId, cell } = cellInfo;
      const row = rowIndexToRow.get(rowIndex);
      if (row) {
        row.cells[columnId] = {
          cellId: cell.id,
          value: responseBody,
          status: cell.status,
        };
      }
    }
  });

  return Array.from(rowIndexToRow.values())
    .filter((row) => !row.deleted)
    .sort((a, b) => a.rowIndex - b.rowIndex);
}

interface UpdateExperimentCellVariables {
  cellId: string;
  status?: string;
  value: string;
  metadata?: Record<string, any>;
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
      promptVariables,
    }: {
      columnName: string;
      columnType: string;
      hypothesisId?: string;
      promptVersionId?: string;
      promptVariables?: string[];
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
          inputKeys: promptVariables,
        },
      });
    },
    onMutate: async (newColumn) => {
      await queryClient.cancelQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });

      const previousData = queryClient.getQueryData([
        "experimentTable",
        orgId,
        experimentTableId,
      ]);

      queryClient.setQueryData(
        ["experimentTable", orgId, experimentTableId],
        (oldData: any) => {
          const newColumnId = `col-${Date.now()}`; // Temporary ID
          const updatedColumns = [
            ...oldData.columns,
            {
              id: newColumnId,
              cells: [], // Or initialize cells as needed
              metadata: {
                hypothesisId: newColumn.hypothesisId,
                promptVersionId: newColumn.promptVersionId,
              },
              columnName: newColumn.columnName,
              columnType: newColumn.columnType,
            },
          ];
          return {
            ...oldData,
            columns: updatedColumns,
          };
        }
      );

      return { previousData };
    },
    onError: (err, newColumn, context) => {
      queryClient.setQueryData(
        ["experimentTable", orgId, experimentTableId],
        context?.previousData
      );
    },
    onSettled: () => {
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
    onMutate: async (newRow) => {
      await queryClient.cancelQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });

      const previousData = queryClient.getQueryData([
        "experimentTable",
        orgId,
        experimentTableId,
      ]);

      queryClient.setQueryData(
        ["experimentTable", orgId, experimentTableId],
        (oldData: any = { rows: [], columns: [] }) => {
          const newRowIndex =
            oldData.rows.length > 0
              ? Math.max(...oldData.rows.map((row: any) => row.rowIndex)) + 1
              : 0;

          const newRowData = {
            id: `row-${newRowIndex}`,
            rowIndex: newRowIndex,
            cells: {}, // Initialize cells if needed
          };

          return {
            ...oldData,
            rows: [...oldData.rows, newRowData],
          };
        }
      );

      return { previousData };
    },
    onError: (err, newRow, context) => {
      queryClient.setQueryData(
        ["experimentTable", orgId, experimentTableId],
        context?.previousData
      );
    },
    onSettled: () => {
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
        sourceRequest?: string;
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

  const deleteExperimentTableRow = useMutation({
    mutationFn: async (rowIndex: number) => {
      const jawnClient = getJawnClient(orgId);
      await jawnClient.DELETE(
        "/v1/experiment/table/{experimentTableId}/row/{rowIndex}",
        {
          params: { path: { experimentTableId, rowIndex } },
        }
      );
    },
    onMutate: async (rowIndex) => {
      await queryClient.cancelQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
      const previousData = queryClient.getQueryData([
        "experimentTable",
        orgId,
        experimentTableId,
      ]);

      queryClient.setQueryData(
        ["experimentTable", orgId, experimentTableId],
        (oldData: any) => {
          if (!oldData) return oldData;

          const updatedRows = oldData.rows.map((row: any) => {
            if (row.rowIndex === rowIndex) {
              return {
                ...row,
                deleted: true,
                cells: Object.keys(row.cells).reduce((cells: any, columnId) => {
                  const cell = row.cells[columnId];
                  return {
                    ...cells,
                    [columnId]: {
                      ...cell,
                      metadata: {
                        ...cell.metadata,
                        deleted: true,
                      },
                    },
                  };
                }, {}),
              };
            }
            return row;
          });

          return {
            ...oldData,
            rows: updatedRows,
          };
        }
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["experimentTable", orgId, experimentTableId],
        context?.previousData
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
    },
  });

  const updateExperimentCell = useMutation<
    unknown,
    unknown,
    UpdateExperimentCellVariables,
    { previousData: any }
  >({
    mutationFn: async ({
      cellId,
      status = "initialized",
      value,
      metadata,
    }: UpdateExperimentCellVariables) => {
      const jawnClient = getJawnClient(orgId);
      await jawnClient.PATCH("/v1/experiment/table/{experimentTableId}/cell", {
        params: { path: { experimentTableId: experimentTableId } },
        body: { cellId, status, value, metadata, updateInputs: true },
      });
    },
    onMutate: async (updatedCell: UpdateExperimentCellVariables) => {
      await queryClient.cancelQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });

      const previousData = queryClient.getQueryData([
        "experimentTable",
        orgId,
        experimentTableId,
      ]);

      queryClient.setQueryData(
        ["experimentTable", orgId, experimentTableId],
        (oldData: any) => {
          const updatedRows = oldData.rows.map((row: any) => {
            const newRow = { ...row };
            Object.keys(newRow.cells).forEach((columnId) => {
              const cell = newRow.cells[columnId];
              if (cell.cellId === updatedCell.cellId) {
                newRow.cells[columnId] = {
                  ...cell,
                  value: updatedCell.value,
                  status: updatedCell.status,
                  metadata: updatedCell.metadata,
                };
              }
            });
            return newRow;
          });
          return {
            ...oldData,
            rows: updatedRows,
          };
        }
      );

      return { previousData };
    },
    onError: (err, updatedCell, context) => {
      queryClient.setQueryData(
        ["experimentTable", orgId, experimentTableId],
        context?.previousData
      );
    },
    onSettled: () => {
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
        columnId: string;
      }>;
    }) => {
      queryClient.setQueryData(
        ["experimentTable", orgId, experimentTableId],
        (data: { rows: TableRow[] } | undefined) => {
          return {
            ...data,
            rows:
              data?.rows.map((row) => {
                const newRow: TableRow = JSON.parse(JSON.stringify(row));
                for (const cell of cells) {
                  if (cell.cellId === row.cells[cell.columnId]?.cellId) {
                    newRow.cells[cell.columnId] = {
                      cellId: cell.cellId,
                      value: "",
                      status: "running",
                    };
                  }
                }
                return newRow;
              }) ?? [],
          };
        }
      );

      const jawnClient = getJawnClient(orgId || "");
      await jawnClient.POST("/v1/experiment/run", {
        body: {
          experimentTableId,
          hypothesisId,
          cells: cells.map((cell) => ({
            cellId: cell.cellId,
          })),
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
    deleteExperimentTableRow,
    updateExperimentCell,
    runHypothesisMutation,
    addExperimentTableRowInsertBatch,
  };
}
