import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Muted } from "@/components/ui/typography";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { memo, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { tracesToTreeNodeData } from "../../../../../lib/sessions/helpers";
import {
  HeliconeRequestType,
  Session,
  Trace,
  TreeNodeData,
} from "../../../../../lib/sessions/sessionTypes";
import { useLocalStorage } from "../../../../../services/hooks/localStorage";
import { Col } from "../../../../layout/common";
import {
  DragColumnItem,
  columnDefToDragColumnItem,
} from "../../../../shared/themed/table/columns/DragList";
import RequestDrawer from "../../../requests/RequestDrawer";
import StatusBadge from "../../../requests/statusBadge";
import SessionTimelineTable from "../Timeline/SessionTimelineTable";
import { TraceSpan } from "../Span";

// Define TableTreeNode to hold all necessary display properties
export interface TableTreeNode {
  id: string;
  name: string; // Group name or fallback path
  trace?: Trace; // Keep original trace for potential reference
  subRows?: TableTreeNode[];

  // Properties populated directly from Trace
  path?: string; // Actual path for leaves
  status?: number;
  createdAt?: number; // Use start_unix_timestamp_ms
  model?: string;
  cost?: number | null;
  latency?: number;
  feedback?: { rating: boolean | null } | null; // Adjusted type based on HeliconeMetadata
  completePath: string;
  heliconeRequestType?: HeliconeRequestType;
}

interface TreeViewProps {
  selectedRequestId: string;
  setSelectedRequestId: (id: string) => void;
  session: Session;
  isOriginalRealtime?: boolean;
}

export const TreeView: React.FC<TreeViewProps> = ({
  session,
  selectedRequestId,
  setSelectedRequestId,
}) => {
  const treeData = useMemo(() => {
    return tracesToTreeNodeData(session.traces);
  }, [session.traces]);

  const tableData = useMemo(() => {
    if (!treeData || !treeData.children) return [];
    return treeData.children.map((node) => convertToTableData(node));
  }, [treeData]);

  const [activeColumns, setActiveColumns] = useLocalStorage<DragColumnItem[]>(
    `session-requests-table-activeColumns`,
    initialColumns.map(columnDefToDragColumnItem),
  );

  const [drawerSize, setDrawerSize] = useLocalStorage(
    "session-request-drawer-size",
    0,
  );
  const drawerRef = useRef<any>(null);

  const selectedRequestData = useMemo(() => {
    if (!selectedRequestId || !session.traces) {
      return undefined;
    }
    const trace = session.traces.find(
      (t) => t.request_id === selectedRequestId,
    );
    if (!trace) {
      return undefined;
    }
    // The Trace object already contains the MappedLLMRequest under the 'request' property
    return trace?.request; // Return the request directly
  }, [selectedRequestId, session.traces]);

  const resizeDrawer = () => {
    drawerRef.current?.expand();
    if (drawerSize === 0) {
      drawerRef.current?.resize(33);
    } else {
      drawerRef.current?.resize(drawerSize);
    }
  };

  const onRowSelectHandler = (row: TableTreeNode) => {
    if (row.trace) {
      setSelectedRequestId(row.trace.request_id);
      resizeDrawer();
    } else {
      // Optional: handle click on group row if needed (e.g., toggle expansion)
      // React-table's expander button already handles toggling.
    }
  };

  const handleCollapseDrawer = () => {
    drawerRef.current?.collapse();
    setDrawerSize(0);
  };

  const handleToggleAllRows = (table: any) => {
    table.toggleAllRowsExpanded();
  };

  // Handle message selection
  const handleRequestSelect = useCallback((request_id: string) => {
    setSelectedRequestId(request_id);
  }, []);

  return (
    <Col className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel
          defaultSize={40}
          minSize={25}
          className="relative bg-white dark:bg-black"
        >
          <ResizablePanelGroup direction="vertical" className="h-full w-full">
            <ResizablePanel
              defaultSize={40}
              minSize={25}
              className="relative bg-white dark:bg-black"
            >
              <TraceSpan
                session={session}
                selectedRequestIdDispatch={[
                  selectedRequestId,
                  setSelectedRequestId,
                ]}
                drawerRef={drawerRef}
              />
            </ResizablePanel>

            <ResizableHandle />

            <ResizablePanel defaultSize={60} minSize={25}>
              <div className="flex h-full border-t border-slate-200 dark:border-slate-800">
                <div className="h-full w-full">
                  <SessionTimelineTable
                    id="session-requests-table"
                    defaultData={tableData}
                    defaultColumns={initialColumns}
                    activeColumns={activeColumns}
                    setActiveColumns={setActiveColumns}
                    skeletonLoading={false}
                    dataLoading={false}
                    onRowSelect={onRowSelectHandler}
                    highlightedIds={
                      selectedRequestId ? [selectedRequestId] : []
                    }
                    fullWidth={true}
                    checkboxMode="never"
                    onToggleAllRows={handleToggleAllRows}
                    selectedIds={selectedRequestId ? [selectedRequestId] : []}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel
          ref={drawerRef}
          defaultSize={0}
          minSize={25}
          maxSize={75}
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => {
            setDrawerSize(0);
          }}
          onExpand={() => {
            drawerRef.current?.resize(drawerSize > 0 ? drawerSize : 33);
          }}
          onResize={(size) => {
            if (size > 0) {
              setDrawerSize(size);
            }
          }}
          className="bg-card"
        >
          {selectedRequestData && (
            <RequestDrawer
              request={selectedRequestData}
              onCollapse={handleCollapseDrawer}
              onRequestSelect={handleRequestSelect}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </Col>
  );
};

export default TreeView;

// Helper function to convert TreeNodeData using only Trace data
function convertToTableData(node: TreeNodeData, level = 0): TableTreeNode {
  const trace = node.trace;
  const id = trace?.request_id ?? `group-${node.subPathName}-${level}`;

  // Extract data directly from the trace object

  const tableNode: TableTreeNode = {
    id: id,
    name: node.subPathName || "",
    trace: trace,
    path: node?.subPathName || trace?.request.preview.response, // Want to show the request preview for leaf nodes
    status: trace?.request.heliconeMetadata?.status?.code,
    createdAt: trace?.start_unix_timestamp_ms,
    model: trace?.request.model ?? undefined,
    cost: trace?.request.heliconeMetadata?.cost,
    latency: node.latency,
    heliconeRequestType: node.heliconeRequestType,
    feedback: trace?.request.heliconeMetadata?.feedback
      ? { rating: trace.request.heliconeMetadata.feedback.rating } // Map feedback structure
      : null,
    completePath: node.currentPath ?? "",
  };

  if (node.children && node.children.length > 0) {
    tableNode.subRows = node.children.map((child: TreeNodeData) =>
      convertToTableData(child, level + 1),
    );
  }

  return tableNode;
}

const ModelCell = memo(({ getValue }: CellContext<TableTreeNode, any>) => {
  const modelName = getValue<string | undefined | null>();
  const [isTruncated, setIsTruncated] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = modelRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [modelName]);

  if (!modelName) {
    return <Muted>n/a</Muted>;
  }

  return (
    <TooltipProvider>
      <Tooltip open={isTruncated ? undefined : false}>
        <TooltipTrigger asChild>
          <div
            ref={modelRef}
            className="truncate"
            style={{ maxWidth: "150px" }} // Adjust max width as needed
          >
            {modelName}
          </div>
        </TooltipTrigger>
        {isTruncated && <TooltipContent>{modelName}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
});

ModelCell.displayName = "ModelCell"; // Add display name for better debugging
// Component for Model cell rendering to allow hooks

// *** Define initialColumns outside the component ***
const initialColumns: ColumnDef<TableTreeNode>[] = [
  // 1. Path
  {
    accessorKey: "path",
    header: "Reponse", // Technically path but leaf node want to be reponse preview
    cell: (info) => info.getValue() ?? <Muted>n/a</Muted>,
  },
  // 2. Status
  {
    accessorKey: "status",
    header: "Status",
    cell: (info) => {
      if (!info.row.original.trace) return null;
      const status = info.getValue<number | undefined | null>();
      if (status === undefined || status === null) return <Muted>n/a</Muted>;
      const statusType = status >= 400 ? "error" : "success";
      return <StatusBadge statusType={statusType} errorCode={status} />;
    },
  },
  // 3. Created At
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: (info) => {
      if (!info.row.original.trace) return null; // Don't render for group rows
      const createdAt = info.getValue();
      if (typeof createdAt !== "number" || isNaN(createdAt)) {
        return <Muted>n/a</Muted>;
      }
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) {
        return <Muted>Invalid Date</Muted>;
      }
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-gray-600 dark:text-gray-400">
                {formatDistanceToNow(date, { addSuffix: true })}
              </span>
            </TooltipTrigger>
            <TooltipContent>{date.toLocaleString()}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  // 4. Model
  {
    accessorKey: "model",
    header: "Model",
    cell: (info) => {
      if (!info.row.original.trace) return null; // Don't render for group rows
      return <ModelCell {...info} />;
    },
  },
  // 5. Cost - Commented out
  /*
  {
    accessorKey: "cost",
    header: "Cost",
    cell: (info: CellContext<TableTreeNode, any>) => {
      const cost = info.getValue();
      return cost !== undefined && cost !== null ? <>{formatNumber(cost)}</> : <Muted>n/a</Muted>;
    },
  },
  */
  // 6. Latency
  {
    accessorKey: "latency",
    header: "Latency",
    cell: (info) => {
      const duration = info.getValue();
      if (typeof duration === "number") {
        return <>{(duration / 1000).toFixed(2)}s</>;
      } else {
        return <Muted>n/a</Muted>;
      }
    },
  },
  // 7. Feedback - Commented out
  /*
  {
    accessorKey: "feedback",
    header: "Feedback",
    cell: (info: CellContext<TableTreeNode, any>) => {
      const feedback = info.getValue();
      if (feedback === undefined || feedback === null) {
        return <Muted>n/a</Muted>;
      }
      return feedback.rating ? <>👍</> : <>👎</>;
    },
  },
  */
];
