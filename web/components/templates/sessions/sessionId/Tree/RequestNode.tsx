import { useRef, useState, useEffect } from "react";
import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { Row } from "../../../../layout/common/row";
import StatusBadge from "../../../requestsV2/statusBadge";
import { clsx } from "../../../../shared/clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

export function RequestNode(props: {
  isRequestSingleChild: boolean;
  selectedRequestId: string;
  node: TreeNodeData;
  setCloseChildren: React.Dispatch<React.SetStateAction<boolean>>;
  closeChildren: boolean;
  setSelectedRequestId: (x: string) => void;
  level: number;
  setShowDrawer: (x: boolean) => void;
}) {
  const {
    isRequestSingleChild,
    selectedRequestId,
    node,
    setCloseChildren,
    closeChildren,
    setSelectedRequestId,
    level,
    setShowDrawer,
  } = props;

  const modelRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = modelRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [node.trace?.request.model]);

  return (
    <TooltipProvider>
      <div
        className={clsx(
          "flex flex-col dark:bg-slate-900 py-[8px] pl-4 px-4 group-hover:cursor-pointer w-full",
          selectedRequestId === node.trace?.request_id
            ? "bg-sky-100 dark:bg-slate-900 hover:bg-sky-100 dark:hover:bg-slate-800"
            : "bg-white dark:bg-slate-950 group-hover:bg-sky-50 dark:group-hover:bg-slate-800"
        )}
        onClick={() =>
          node.children
            ? setCloseChildren(!closeChildren)
            : setSelectedRequestId(node.trace?.request_id ?? "")
        }
      >
        <Row className="w-full gap-2 items-center">
          <Row className="items-center gap-2 flex-grow min-w-0">
            <div
              className="flex-shrink-0 bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-200 px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap"
              title={
                node.trace?.request.model === "vector_db" ||
                node.trace?.request.model.startsWith("tool")
                  ? node.trace?.request.model.split(":")[0]
                  : node.name
              }
            >
              {node.trace?.request.model === "vector_db" ||
              node.trace?.request.model.startsWith("tool")
                ? node.trace?.request.model.split(":")[0]
                : node.name}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  ref={modelRef}
                  className="flex-grow flex-shrink-1 max-w-[200px] min-w-[100px] bg-transparent dark:bg-transparent dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2 py-1 text-xs font-medium rounded-md truncate"
                >
                  {node.trace?.request.model}
                </div>
              </TooltipTrigger>
              {isTruncated && (
                <TooltipContent>
                  <span>{node.trace?.request.model}</span>
                </TooltipContent>
              )}
            </Tooltip>
            <span className="text-slate-400 dark:text-slate-600 text-[11px] whitespace-nowrap">
              {isRequestSingleChild ? "" : `(${node.duration})`}
            </span>
          </Row>
          <Row className="flex-shrink-0 items-center gap-2">
            {node.trace?.request.status && (
              <StatusBadge
                statusType={node.trace?.request.status.statusType}
                errorCode={node.trace?.request.status.code}
              />
            )}
          </Row>
        </Row>
      </div>
    </TooltipProvider>
  );
}
