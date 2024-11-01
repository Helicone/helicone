import { getJawnClient } from "../../../../../../lib/clients/jawn";
import { placeAssetIdValues } from "../../../../../../services/lib/requestTraverseHelper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  value: string | null;
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

//TODO: Move to metadata and remove this
export function isUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

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

export async function getTableData({
  experimentTableData,
  responseBodyCache,
  getRequestDataByIds,
}: {
  experimentTableData: ExperimentTable | null;
  responseBodyCache: Record<string, any>;
  getRequestDataByIds: (requestIds: string[]) => Promise<any[]>;
}): Promise<TableRow[]> {
  if (!experimentTableData) {
    return [];
  }

  // Build a mapping of rowIndex to row object
  const rowIndexToRow = new Map<number, TableRow>();

  // Collect requestIds for experiment columns
  const requestIdsToFetch = new Set<string>();

  await Promise.all(
    experimentTableData.columns.map(async (column) => {
      const columnId = column.id;
      console.log("columnId", columnId);
      console.log("column.cells", column.cells);

      // Process all columns
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
            row = newRow; // Ensure 'row' is defined
          }

          // Now process the cell data
          if (cell.value !== undefined && cell.value !== null) {
            if (
              isUUID(cell.value) &&
              (cell.status === "initialized" || cell.status === "success")
            ) {
              const requestDataArray = await getRequestDataByIds([cell.value]);
              if (requestDataArray && requestDataArray.length > 0) {
                const responseBody = await fetchRequestResponseBody(
                  requestDataArray[0]
                );
                row.cells[columnId] = {
                  cellId: cell.id,
                  value: responseBody,
                  status: cell.status,
                };
              } else {
                // Handle case where request data is not found
                row.cells[columnId] = {
                  cellId: cell.id,
                  value: null,
                  status: cell.status,
                };
              }
            } else {
              // Assign the actual cell.value for non-UUID values
              row.cells[columnId] = {
                cellId: cell.id,
                value: cell.value,
                status: cell.status,
              };
            }
          } else {
            // Handle cells with no value
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

  // Convert the map to an array and sort by rowIndex
  const rows = Array.from(rowIndexToRow.values()).sort(
    (a, b) => a.rowIndex - b.rowIndex
  );
  console.log("rows", rows);
  return rows;
}

export function useExperimentTable(orgId: string, experimentTableId: string) {
  const queryClient = useQueryClient();
  const { data: experimentTableQuery, refetch: refetchExperimentTable } =
    useQuery(["experimentTable", orgId, experimentTableId], async () => {
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
    });

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
      const res = await jawnClient.POST(
        "/v1/experiment/table/{experimentTableId}/column",
        {
          params: {
            path: { experimentTableId: experimentTableId || "" },
          },
          body: {
            columnName,
            columnType,
            hypothesisId,
            promptVersionId,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
    },
  });

  const addExperimentTableRow = useMutation({
    mutationFn: async ({ promptVersionId }: { promptVersionId: string }) => {
      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.POST(
        "/v1/experiment/table/{experimentTableId}/row",
        {
          params: { path: { experimentTableId: experimentTableId } },
          body: { promptVersionId: promptVersionId },
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
      status,
      value,
      metadata,
    }: {
      cellId: string;
      status: string;
      value: string;
      metadata?: Record<string, any>;
    }) => {
      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.PATCH(
        "/v1/experiment/table/{experimentTableId}/cell",
        {
          params: { path: { experimentTableId: experimentTableId } },
          body: { cellId, status, value, metadata, updateInputs: true },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
      console.log("updateExperimentCell success");
    },
  });

  // const fetchPromptVersionTemplate = useQuery(
  //   ["promptVersionTemplate", experimentTableQuery?.promptSubversionId],
  //   async () => {
  //     const jawnClient = getJawnClient(orgId);
  //     const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
  //       params: {
  //         path: {
  //           promptVersionId:
  //             (experimentTableQuery?.promptSubversionId as string) ?? "",
  //         },
  //       },
  //     });

  //     return res.data?.data;
  //   },
  //   {
  //     cacheTime: Infinity,
  //     enabled: !!orgId && !!experimentTableQuery?.promptSubversionId,
  //   }
  // );

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
    },
  });

  return {
    experimentTableQuery,
    addExperimentTableColumn,
    addExperimentTableRow,
    updateExperimentCell,
    runHypothesisMutation,
  };
}
