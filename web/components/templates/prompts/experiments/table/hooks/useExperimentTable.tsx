import { getJawnClient } from "@/lib/clients/jawn";
import { placeAssetIdValues } from "@/services/lib/requestTraverseHelper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

interface Column {
  id: string;
  columnType: string;
  cells: Array<{
    rowIndex: number;
    requestId?: string;
    value?: any;
    metadata?: {
      datasetRowId?: string;
    };
  }>;
}

interface ExperimentTableData {
  columns: Column[];
}

export async function updateTableData({
  experimentTableData,
  getRequestDataByIds,
}: {
  experimentTableData: ExperimentTableData | null;
  getRequestDataByIds: (requestIds: string[]) => Promise<any[]>;
}): Promise<any[]> {
  if (!experimentTableData) {
    return [];
  }

  // Build a mapping of rowIndex to row object
  const rowIndexToRow = new Map<number, any>();

  // Collect requestIds for experiment columns
  const requestIdsToFetch = new Set<string>();

  experimentTableData.columns.forEach((column) => {
    const columnId = column.id;

    if (column.columnType === "experiment" || column.columnType === "output") {
      // Process experiment columns
      column.cells.forEach((cell) => {
        const rowIndex = cell.rowIndex;
        let row = rowIndexToRow.get(rowIndex);
        if (!row) {
          row = {
            id: `row-${rowIndex}`,
            rowIndex,
            isLoading: {},
            cellId: `${columnId}_${rowIndex}`,
          };
          rowIndexToRow.set(rowIndex, row);
        }

        if (cell.requestId) {
          // Temporarily store requestId in the cell data
          row[columnId] = {
            requestId: cell.requestId,
            cellId: `${columnId}_${rowIndex}`,
          };
          requestIdsToFetch.add(cell.requestId);
        } else {
          row[columnId] = {
            requestId: null,
            cellId: `${columnId}_${rowIndex}`,
          };
        }
      });
    } else {
      // Non-experiment columns
      column.cells.forEach((cell) => {
        const rowIndex = cell.rowIndex;
        let row = rowIndexToRow.get(rowIndex);
        if (!row) {
          row = { id: `row-${rowIndex}`, rowIndex, isLoading: {} };
          rowIndexToRow.set(rowIndex, row);
        }

        // Set the value for the column in the row
        row[columnId] = cell.value;

        // Store requestId if needed
        if (cell.requestId) {
          row.requestId = cell.requestId;
        }
        if (cell.metadata?.datasetRowId) {
          row.dataset_row_id = cell.metadata.datasetRowId;
        }
      });
    }
  });

  // Fetch request data for experiment columns
  const requestDataMap = new Map<string, any>();
  if (requestIdsToFetch.size > 0) {
    const requestIdsArray = Array.from(requestIdsToFetch);

    // Fetch data for each requestId individually
    await Promise.all(
      requestIdsArray.map(async (requestId) => {
        const requestDataArray = await getRequestDataByIds([requestId]);
        if (requestDataArray && requestDataArray.length > 0) {
          requestDataMap.set(requestId, requestDataArray[0]);
        }
      })
    );
  }

  // Now construct the rowData array
  const newRowData = await Promise.all(
    Array.from(rowIndexToRow.values()).map(async (row) => {
      // Process experiment column data
      await Promise.all(
        experimentTableData.columns.map(async (column) => {
          const columnId = column.id;

          // If it's an experiment or output column
          if (
            column.columnType === "experiment" ||
            column.columnType === "output"
          ) {
            const cellData = row[columnId] as any;

            // Always initialize the column with the cellId from cellData
            if (!row[columnId] && cellData?.cellId) {
              row[columnId] = {
                responseBody: null,
                cellId: cellData.cellId,
              };
            }

            // If we have request data, process it
            if (cellData?.requestId) {
              const requestData = requestDataMap.get(cellData.requestId);
              if (requestData) {
                const responseBody = await fetchRequestResponseBody(
                  requestData
                );
                row[columnId] = {
                  responseBody,
                  cellId: cellData.cellId,
                };
              }
            }
          }
        })
      );
      return row;
    })
  );

  // Sort rows by rowIndex
  newRowData.sort((a, b) => a.rowIndex - b.rowIndex);

  return newRowData;
}

export async function useExperimentTable(orgId: string, experimentId: string) {
  const queryClient = useQueryClient();
  const experimentTableQuery = useQuery(
    ["experimentTable", orgId, experimentId],
    async () => {
      if (!orgId || !experimentId) return null;

      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.POST(
        "/v1/experiment/table/{experimentId}/query",
        {
          params: {
            path: {
              experimentId: experimentId,
            },
          },
        }
      );

      const rowData = await updateTableData({
        experimentTableData: res.data?.data ?? null,
        getRequestDataByIds: (requestIds) =>
          getRequestDataByIds(orgId, requestIds),
      });

      return rowData;
    },
    {
      enabled: !!orgId && !!experimentId,
    }
  );

  const updateTableCell = useMutation({
    mutationFn: async (cellId: string, value: any) => {
      const jawnClient = getJawnClient(orgId);

      jawnClient.PATCH("/v1/experiment/table/{experimentId}/cell/{cellId}", {
        params: { path: { experimentId: experimentId, cellId } },
        body: { cellId, value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentId],
      });
    },
  });

  return {
    experimentTableQuery,
    updateTableCell,
  };
}
