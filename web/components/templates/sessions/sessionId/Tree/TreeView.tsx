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
import { HeliconeRequest } from "@/packages/llm-mapper/types";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { tracesToTreeNodeData } from "../../../../../lib/sessions/helpers";
import {
  Session,
  Trace,
  TreeNodeData,
} from "../../../../../lib/sessions/sessionTypes";
import { useLocalStorage } from "../../../../../services/hooks/localStorage";
import { useGetRequests } from "../../../../../services/hooks/requests";
import { Col } from "../../../../layout/common";
import {
  DragColumnItem,
  columnDefToDragColumnItem,
} from "../../../../shared/themed/table/columns/DragList";
import ThemedTable from "../../../../shared/themed/table/themedTable";
import StatusBadge from "../../../requests/statusBadge";
import { TraceSpan } from "../Span";

// Define TableTreeNode to hold all necessary display properties
interface TableTreeNode {
  id: string;
  name: string; // Group name or fallback path
  trace?: Trace; // Keep original trace for potential reference
  subRows?: TableTreeNode[];

  // Properties populated from Trace or looked-up HeliconeRequest
  path?: string; // Actual path for leaves
  status?: number;
  createdAt?: number; // Use start_unix_timestamp_ms
  model?: string;
  cost?: number | null;
  latency?: number;
  feedback?: { rating: boolean } | null;
}

// Helper function to convert TreeNodeData and lookup full request data
function convertToTableData(
  node: TreeNodeData,
  allRequests: HeliconeRequest[], // Pass the full request list
  level = 0
): TableTreeNode {
  const id = node.trace?.request_id ?? `group-${node.name}-${level}`;

  // Find the corresponding full HeliconeRequest if this is a leaf node
  const requestDetails = node.trace?.request_id
    ? allRequests.find((req) => req.request_id === node.trace?.request_id)
    : undefined;

  const tableNode: TableTreeNode = {
    id: id,
    name: node.name,
    trace: node.trace,
    // Populate based on trace and requestDetails
    path: node.trace?.path || node.name, // Use trace path or group name
    status: requestDetails?.response_status,
    createdAt: node.trace?.start_unix_timestamp_ms,
    model: requestDetails?.response_model ?? undefined, // Map null model to undefined
    latency:
      node.trace?.end_unix_timestamp_ms && node.trace?.start_unix_timestamp_ms
        ? node.trace.end_unix_timestamp_ms - node.trace.start_unix_timestamp_ms
        : undefined, // Latency from trace timestamps
  };

  if (node.children && node.children.length > 0) {
    // Recursively convert children, passing the request list down
    tableNode.subRows = node.children.map((child: TreeNodeData) =>
      convertToTableData(child, allRequests, level + 1)
    );
  }

  return tableNode;
}

// Component for Model cell rendering to allow hooks
const ModelCell = ({ getValue }: CellContext<TableTreeNode, any>) => {
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
};

// *** Define initialColumns outside the component ***
const initialColumns: ColumnDef<TableTreeNode>[] = [
  // 1. Path
  {
    accessorKey: "path",
    header: "Path",
    cell: (info: CellContext<TableTreeNode, any>) =>
      info.getValue() ?? <Muted>n/a</Muted>,
  },
  // 2. Status
  {
    accessorKey: "status",
    header: "Status",
    cell: (info: CellContext<TableTreeNode, any>) => {
      if (!info.row.original.trace) return null; // Don't render for group rows
      const status = info.getValue<number | undefined | null>();

      if (status === undefined || status === null) {
        return <Muted>n/a</Muted>;
      }

      let statusType: "success" | "error" = "success";
      if (status >= 400) {
        statusType = "error";
      }

      return <StatusBadge statusType={statusType} errorCode={status} />;
    },
  },
  // 3. Created At
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: (info: CellContext<TableTreeNode, any>) => {
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
    cell: (info: CellContext<TableTreeNode, any>) => {
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
    cell: (info: CellContext<TableTreeNode, any>) => {
      if (!info.row.original.trace) return null; // Don't render for group rows
      const duration = info.getValue();
      return duration !== undefined ? (
        <>{(duration / 1000).toFixed(2)}s</>
      ) : (
        <Muted>n/a</Muted>
      );
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

interface TreeViewProps {
  session: Session;
  selectedRequestId: string;
  setSelectedRequestId: (id: string) => void;
  showSpan: boolean;
  requests: ReturnType<typeof useGetRequests>;
  realtimeData: {
    isRealtime: boolean;
    effectiveRequests: HeliconeRequest[];
    originalRequest: HeliconeRequest | null;
  };
}

const TreeView: React.FC<TreeViewProps> = ({
  session,
  selectedRequestId,
  setSelectedRequestId,
  showSpan,
  requests,
  realtimeData,
}) => {
  const { isRealtime } = realtimeData;

  const onBoardingRequestTrace = useMemo(
    () =>
      session.traces.find((t) => t.path === "/planning/extract-travel-plan"),
    [session.traces]
  );

  const treeData = useMemo(() => {
    if (isRealtime) return null;
    return tracesToTreeNodeData(session.traces);
  }, [isRealtime, session.traces]);

  const tableData = useMemo(() => {
    if (!treeData || !treeData.children) return [];
    // Ensure we have the actual list of requests - use requests.requests?.requests
    const allRequests = requests.requests?.requests ?? [];
    // Convert tree data, passing the full request list for lookups
    return treeData.children.map((node) =>
      convertToTableData(node, allRequests)
    );
  }, [treeData, requests.requests?.requests]);

  // Columns are defined outside again
  // Remove the useMemo for columns definition
  // const columns = useMemo(() => { ... }, [session.traces, requests.requests?.data]);

  const [activeColumns, setActiveColumns] = useLocalStorage<DragColumnItem[]>(
    `session-requests-table-activeColumns`,
    initialColumns.map(columnDefToDragColumnItem) // Use initialColumns defined outside
  );

  const onRowSelectHandler = (row: TableTreeNode) => {
    // Updated row type
    // Only select actual requests (leaf nodes with a trace)
    if (row.trace) {
      setSelectedRequestId(row.trace.request_id);
    } else {
      // Optional: handle click on group row if needed (e.g., toggle expansion)
      // React-table's expander button already handles toggling.
    }
  };

  return (
    <Col className="h-full">
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
            realtimeData={realtimeData}
          />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={60} minSize={25}>
          <div className="h-full border-t border-slate-200 dark:border-slate-800 flex">
            {!isRealtime && (
              <div className="h-full w-full">
                <ThemedTable
                  id="session-requests-table"
                  defaultData={tableData}
                  defaultColumns={initialColumns} // Use initialColumns defined outside
                  activeColumns={activeColumns}
                  setActiveColumns={setActiveColumns}
                  skeletonLoading={false} // TODO: Pass loading state if available
                  dataLoading={false} // TODO: Pass loading state if available
                  onRowSelect={onRowSelectHandler}
                  highlightedIds={selectedRequestId ? [selectedRequestId] : []}
                  fullWidth={true}
                  checkboxMode="never"
                />
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Col>
  );
};

export default TreeView;
