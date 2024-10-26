import { useOrg } from "@/components/layout/organizationContext";
import { Button } from "@/components/ui/button";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  GridApi,
  GridReadyEvent,
  CellValueChangedEvent,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import { AgGridReact } from "ag-grid-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AddColumnHeader from "./AddColumnHeader";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useLocalStorage } from "@/services/hooks/localStorage";
import LoadingAnimation from "../../../../shared/loadingAnimation";
import ExportButton from "../../../../shared/themed/table/exportButton";
import { ColumnsDropdown } from "./components/customButtonts";
import {
  InputCellRenderer,
  CustomHeaderComponent,
} from "./components/tableElementsRenderer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import clsx from "clsx";
import { ScrollArea } from "../../../../ui/scroll-area";
import { ExperimentTable as ExperimentTableType } from "@/lib/types"; // Update the import path as needed
import { useQuery } from "@tanstack/react-query";

interface ExperimentTableProps {
  promptSubversionId?: string;
  experimentId?: string;
}

export function ExperimentTable({
  promptSubversionId,
  experimentId,
}: ExperimentTableProps) {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const jawn = useJawnClient();
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [wrapText, setWrapText] = useState(false);
  const [columnView, setColumnView] = useState<"all" | "inputs" | "outputs">(
    "all"
  );
  const [showScoresTable, setShowScoresTable] = useLocalStorage(
    "showScoresTable",
    false
  );

  const experimentTableRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridApi | null>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridRef.current = params.api;
  }, []);

  // Fetch the experiment table data
  const fetchExperimentTable = useCallback(async () => {
    if (!orgId || !experimentId) return null;

    const jawnClient = getJawnClient(orgId);
    const res = await jawnClient.POST(
      "/v1/experiment/table/{experimentTableId}",
      {
        params: {
          path: {
            experimentTableId: experimentId,
          },
        },
      }
    );

    // if (res.error) {
    //   console.error("Error fetching experiment table:", res.error);
    //   return null;
    // }

    return res.data?.data; // Assuming the data is in res.data.data
  }, [orgId, experimentId]);

  const { data: experimentTableData, refetch: refetchExperimentTable } =
    useQuery(["experimentTable", orgId, experimentId], fetchExperimentTable, {
      enabled: !!orgId && !!experimentId,
      refetchInterval: 10000,
    });

  // State for columns and row data
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [rowData, setRowData] = useState<any[]>([]);

  // Handle adding a new column
  const handleAddColumn = useCallback(
    async (columnName: string, columnType: string) => {
      const res = await jawn.POST(
        "/v1/experiment/table/{experimentTableId}/column",
        {
          params: {
            path: { experimentTableId: experimentId || "" },
          },
          body: {
            columnName,
            columnType, // e.g., "input", "output", or "experiment"
          },
        }
      );

      if (res.error) {
        console.error("Error adding column:", res);
      } else {
        // Refetch the experiment table or update state
        await refetchExperimentTable();
      }
    },
    [experimentId, jawn, refetchExperimentTable]
  );

  // Process columns
  useEffect(() => {
    if (!experimentTableData) return;

    // Map the columns from the data
    const cols: ColDef[] = experimentTableData.columns.map((col) => ({
      headerName: col.columnName,
      field: col.id, // Use the column ID as the field
      editable: true,
      cellRenderer: InputCellRenderer, // Use your custom cell renderer if needed
      headerComponent: CustomHeaderComponent, // Use custom header if needed
      cellStyle: {
        whiteSpace: wrapText ? "normal" : "nowrap",
      },
    }));

    // Optionally add an action column to add new columns
    cols.push({
      headerName: "", // Empty header
      field: "addColumn",
      width: 150,
      suppressSizeToFit: true,
      suppressMenu: true,
      sortable: false,
      filter: false,
      resizable: false,
      headerComponent: AddColumnHeader, // Component to render the 'Add Column' button
      headerComponentParams: {
        experimentId,
        onAddColumn: handleAddColumn,
      },
    });

    setColumnDefs(cols);
  }, [experimentTableData, wrapText, handleAddColumn, experimentId]);

  // Process row data
  useEffect(() => {
    if (!experimentTableData) return;

    // Create a map of rowIndex to row data
    const rowsMap: { [key: number]: any } = {};

    experimentTableData.columns.forEach((col) => {
      col.cells.forEach((cell) => {
        if (!rowsMap[cell.rowIndex]) {
          rowsMap[cell.rowIndex] = { id: cell.rowIndex };
        }
        rowsMap[cell.rowIndex][col.id] = cell.value;
      });
    });

    // Convert the rowsMap to an array and sort by rowIndex
    const rows = Object.values(rowsMap).sort((a, b) => a.id - b.id);
    setRowData(rows);
    setIsDataLoading(false);
  }, [experimentTableData]);

  // Handle cell value changes
  const handleCellValueChanged = useCallback(
    async (event: CellValueChangedEvent) => {
      const { data, colDef, newValue } = event;
      const columnId = colDef.field; // The field is the column ID
      const rowIndex = data.id; // The rowIndex is stored in the 'id' field

      // Call the API to update the cell value
      const res = await jawn.POST(
        "/v1/experiment/table/{experimentTableId}/cell",
        {
          params: {
            path: { experimentTableId: experimentId || "" },
          },
          body: {
            columnId: columnId || "",
            rowIndex,
            value: newValue,
          },
        }
      );

      if (res.error) {
        console.error("Error updating cell value:", res);
      } else {
        // Optionally refetch data or update state
        await refetchExperimentTable();
      }
    },
    [experimentId, jawn, refetchExperimentTable]
  );

  // Handle adding a new row
  const handleAddRow = useCallback(async () => {
    // Determine the next rowIndex
    const nextRowIndex =
      rowData.length > 0 ? Math.max(...rowData.map((r) => r.id)) + 1 : 1;

    // For each column, insert a cell with the new rowIndex and empty value
    for (const col of experimentTableData?.columns || []) {
      const res = await jawn.POST(
        "/v1/experiment/table/{experimentTableId}/cell",
        {
          params: {
            path: { experimentTableId: experimentId || "" },
          },
          body: {
            columnId: col.id,
            rowIndex: nextRowIndex,
            value: "", // Or null, depending on your requirements
          },
        }
      );

      // if (res.error) {
      //   console.error("Error adding cell:", res.error);
      //   // Optionally handle errors accordingly
      // }
    }

    // Refetch the experiment table or update state
    await refetchExperimentTable();
  }, [
    experimentId,
    jawn,
    experimentTableData,
    rowData,
    refetchExperimentTable,
  ]);

  if (isDataLoading) {
    return (
      <div className="flex items-center justify-center h-screen flex-col">
        <LoadingAnimation />
        <h1 className="text-4xl font-semibold">Getting your experiments</h1>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex flex-col space-y-1 w-full">
        <div className="flex flex-row space-x-2 justify-end w-full pr-4">
          <Button
            variant="outline"
            className="py-0 px-2 border border-slate-200 h-8 items-center justify-center space-x-1 flex gap-2"
            onClick={() => setShowScoresTable(!showScoresTable)}
          >
            <div>{"{ }"}</div> {showScoresTable ? "Hide" : "Show"} Scores
          </Button>
          <ColumnsDropdown
            wrapText={wrapText}
            setWrapText={setWrapText}
            columnView={columnView}
            setColumnView={setColumnView}
          />
          <ExportButton
            className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1 bg-white"
            key="export-button"
            rows={rowData} // Adjust if needed
          />
        </div>

        {/* Render the table */}
        <div
          className="ag-theme-alpine w-full overflow-hidden"
          ref={experimentTableRef}
          style={
            {
              "--ag-header-height": "40px",
              "--ag-header-background-color": "#f3f4f6",
              "--ag-header-foreground-color": "#1f2937",
              "--ag-header-cell-hover-background-color": "#e5e7eb",
              "--ag-header-column-separator-color": "#d1d5db",
              "--ag-cell-horizontal-border": "solid #E2E8F0",
              "--ag-border-color": "#E2E8F0",
              "--ag-borders": "none",
            } as React.CSSProperties
          }
        >
          <AgGridReact
            ref={gridRef as any}
            rowData={rowData}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            // onColumnResized={onColumnResized}
            // onColumnMoved={onColumnMoved}
            enableCellTextSelection={true}
            colResizeDefault="shift"
            suppressRowTransform={true}
            domLayout="autoHeight"
            getRowId={(params) => params.data.id.toString()}
            context={
              {
                // Add any necessary context
              }
            }
            rowClass="border-b border-gray-200 hover:bg-gray-50"
            headerHeight={40}
            rowHeight={50}
            onCellValueChanged={handleCellValueChanged}
          />
        </div>
        <Button
          variant="ghost"
          onClick={handleAddRow}
          className="max-w-32 flex flex-row space-x-2 text-md text-[#334155]"
        >
          <PlusIcon className="h-6 w-6" />
          Add row
        </Button>
      </div>

      {/* Include any additional components or modals */}
    </div>
  );

  // if (isDataLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen flex-col">
  //       <LoadingAnimation />
  //       <h1 className="text-4xl font-semibold">Getting your experiments</h1>
  //     </div>
  //   );
  // }

  return (
    <div className="relative w-full">
      <div className="flex flex-col space-y-1 w-full">
        <div className="flex flex-row space-x-2 justify-end w-full pr-4">
          <Button
            variant="outline"
            className="py-0 px-2 border border-slate-200 h-8 items-center justify-center space-x-1 flex gap-2"
            onClick={() => setShowScoresTable(!showScoresTable)}
          >
            <div>{"{ }"}</div> {showScoresTable ? "Hide" : "Show"} Scores
          </Button>
          <ColumnsDropdown
            wrapText={wrapText}
            setWrapText={setWrapText}
            columnView={columnView}
            setColumnView={setColumnView}
          />
          <ExportButton
            className="py-0 px-2 border border-slate-200 h-8 flex items-center justify-center space-x-1 bg-white"
            key="export-button"
            rows={rowData} // Adjust if needed
          />
        </div>

        {/* Render the table */}
        <div
          className="ag-theme-alpine w-full overflow-hidden"
          ref={experimentTableRef}
          style={
            {
              "--ag-header-height": "40px",
              "--ag-header-background-color": "#f3f4f6",
              "--ag-header-foreground-color": "#1f2937",
              "--ag-header-cell-hover-background-color": "#e5e7eb",
              "--ag-header-column-separator-color": "#d1d5db",
              "--ag-cell-horizontal-border": "solid #E2E8F0",
              "--ag-border-color": "#E2E8F0",
              "--ag-borders": "none",
            } as React.CSSProperties
          }
        >
          <AgGridReact
            ref={gridRef as any}
            rowData={rowData}
            columnDefs={columnDefs}
            onGridReady={onGridReady}
            onColumnResized={onColumnResized}
            onColumnMoved={onColumnMoved}
            enableCellTextSelection={true}
            colResizeDefault="shift"
            suppressRowTransform={true}
            domLayout="autoHeight"
            getRowId={(params) => params.data.id.toString()}
            context={
              {
                // Add any necessary context
              }
            }
            rowClass="border-b border-gray-200 hover:bg-gray-50"
            headerHeight={40}
            rowHeight={50}
            onCellValueChanged={handleCellValueChanged}
          />
        </div>
        <Button
          variant="ghost"
          onClick={handleAddRow}
          className="max-w-32 flex flex-row space-x-2 text-md text-[#334155]"
        >
          <PlusIcon className="h-6 w-6" />
          Add row
        </Button>
      </div>

      {/* Include any additional components or modals */}
    </div>
  );
}
