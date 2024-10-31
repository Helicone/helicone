import { useRef } from "react";
import { getJawnClient } from "../../../../../../lib/clients/jawn";
import { placeAssetIdValues } from "../../../../../../services/lib/requestTraverseHelper";

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

type ColumnType = "input" | "output" | "experiment";
type CellStatus = "initialized" | "success";

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

export async function updateTableData({
  experimentTableData,
  responseBodyCache,
  getRequestDataByIds,
}: {
  experimentTableData: ExperimentTable | null;
  responseBodyCache: Record<string, any>;
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
            cellId: cell.id,
          };
          rowIndexToRow.set(rowIndex, row);
        }

        if (cell.value) {
          // Temporarily store value in the cell data
          row[columnId] = {
            value: cell.value,
            cellId: cell.id,
          };
          requestIdsToFetch.add(cell.value);
        } else {
          row[columnId] = {
            value: null,
            cellId: cell.id,
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

        // Store value if needed
        if (cell.value) {
          row.value = cell.value;
        }
        if (cell.metadata && cell.metadata.datasetRowId) {
          row.dataset_row_id = cell.metadata.datasetRowId;
        }
      });
    }
  });

  const requestDataMap = new Map<string, any>();
  if (requestIdsToFetch.size > 0) {
    const requestIdsArray = Array.from(requestIdsToFetch);

    // Fetch data for each value individually
    await Promise.all(
      requestIdsArray.map(async (value) => {
        const requestDataArray = await getRequestDataByIds([value]);
        if (requestDataArray && requestDataArray.length > 0) {
          requestDataMap.set(value, requestDataArray[0]);
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
                cellId: cellData.cellId, // Use the original cellId
              };
            }

            // If we have request data, process it
            if (cellData?.value) {
              const requestData = requestDataMap.get(cellData.value);
              if (requestData) {
                const responseBody = await fetchRequestResponseBody(
                  requestData
                );
                row[columnId] = {
                  responseBody,
                  cellId: cellData.cellId, // Always use the original cellId
                };

                // Refresh the cell if needed
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

  // Preserve isLoading state from previous rowData
  const updatedRowData = newRowData.map((newRow) => {
    // Find the matching row in the previous rowData
    const existingRow = rowIndexToRow.get(newRow.rowIndex);

    // If an existing row is found, preserve its isLoading state
    if (existingRow && existingRow.isLoading) {
      return {
        ...newRow,
        isLoading: existingRow.isLoading,
      };
    }
    // Otherwise, initialize isLoading as an empty object
    return {
      ...newRow,
      isLoading: {},
    };
  });
  return updatedRowData;
}


