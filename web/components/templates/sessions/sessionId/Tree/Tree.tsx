import { Col, Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarCloseIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { HeliconeRequest } from "@helicone-package/llm-mapper/types";
import { Trace, TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { clsx } from "../../../../shared/clsx";
import { PathNode } from "./PathNode";
import { RequestNode } from "./RequestNode";

export interface TreeNodeProps {
  node: TreeNodeData;
  selectedRequestIdDispatch: [string, (x: string) => void];
  isLastChild: boolean;
  level: number;
  collapseAll?: boolean;
  isRequestSingleChild?: boolean;
  onBoardingRequestTrace?: Trace;
  realtimeData?: {
    isRealtime: boolean;
    effectiveRequests: HeliconeRequest[];
    originalRequest: HeliconeRequest | null;
  };
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  selectedRequestIdDispatch,
  level,
  collapseAll,
  isRequestSingleChild,
  onBoardingRequestTrace,
  realtimeData,
}) => {
  const [closeChildren, setCloseChildren] = useState(collapseAll ?? false);
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;

  useEffect(() => {
    setCloseChildren(collapseAll ?? false);
  }, [collapseAll]);

  return (
    <div
      className={clsx(
        level === 0 ? "p-0 m-0" : "relative flex flex-col",
        "bg-white dark:bg-slate-950"
      )}
      key={`${node.subPathName}-${node.trace?.request_id}`}
    >
      {!node.trace &&
      node.children &&
      (node.children.filter((c) => !c.trace).length ||
        node.children.filter((c) => c.trace).length === 0 ||
        node.children.filter((c) => c.trace).length > 1) ? (
        <Col className="overflow-x-auto overflow-y-hidden">
          <Row className="w-full group">
            {new Array(level).fill(null).map((_, index) => (
              <div
                key={index}
                className="h-9 bg-slate-50 dark:bg-slate-950 w-[24px] relative shrink-0 group-hover:bg-slate-100 dark:group-hover:bg-slate-900 group-hover:cursor-pointer"
                onClick={() =>
                  node.children
                    ? setCloseChildren(!closeChildren)
                    : setSelectedRequestId(node.trace?.request_id ?? "")
                }
              >
                <div className="absolute top-0 right-[0px] w-[1px] h-9 bg-slate-200 dark:bg-slate-700 z-[2]" />
              </div>
            ))}
            <PathNode
              node={node}
              setCloseChildren={setCloseChildren}
              closeChildren={closeChildren}
              setSelectedRequestId={setSelectedRequestId}
              level={level}
            />
          </Row>
          {!closeChildren &&
            node.children.map((child, index) => (
              <TreeNode
                onBoardingRequestTrace={onBoardingRequestTrace}
                key={index}
                node={child}
                selectedRequestIdDispatch={selectedRequestIdDispatch}
                isLastChild={
                  node.children?.length
                    ? index === node.children?.length - 1
                    : false
                }
                level={level + 1}
                isRequestSingleChild={node?.children?.length === 1}
                realtimeData={realtimeData}
              />
            ))}
        </Col>
      ) : (
        <Row className="w-full group">
          <div
            className={clsx(
              "h-[42px] w-[24px]  shrink-0 group-hover:cursor-pointer sticky top-1/2 left-0 z-[2]",
              selectedRequestId ===
                (node.children
                  ? node.children[0].trace?.request_id
                  : node.trace?.request_id)
                ? "bg-sky-100 dark:bg-slate-900"
                : "bg-white dark:bg-slate-950 group-hover:bg-sky-50 dark:group-hover:bg-slate-800"
            )}
            onClick={() =>
              node.children
                ? setSelectedRequestId(node.children[0].trace?.request_id ?? "")
                : setSelectedRequestId(node.trace?.request_id ?? "")
            }
          >
            <div className="absolute top-0 right-[0px] w-[1px] h-[42px] bg-slate-200 dark:bg-slate-700 z-[2]" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    className={clsx(
                      "p-1 m-0 items-center hidden group-hover:flex z-[20]"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequestId(
                        node.children
                          ? node.children[0].trace?.request_id ?? ""
                          : node.trace?.request_id ?? ""
                      );
                    }}
                  >
                    <SidebarCloseIcon className="w-4 h-4 text-slate-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>View request</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {level > 0 &&
            new Array(level - 1).fill(null).map((_, index) => (
              <div
                key={index}
                className={clsx(
                  "h-[42px] w-[24px] relative shrink-0 group-hover:cursor-pointer",
                  selectedRequestId ===
                    (node.children
                      ? node.children[0].trace?.request_id
                      : node.trace?.request_id)
                    ? "bg-sky-100 dark:bg-slate-900"
                    : "bg-white dark:bg-slate-950 group-hover:bg-sky-50 dark:group-hover:bg-slate-900"
                )}
                onClick={() =>
                  node.children
                    ? setSelectedRequestId(
                        node.children[0].trace?.request_id ?? ""
                      )
                    : setSelectedRequestId(node.trace?.request_id ?? "")
                }
              >
                <div className="absolute top-0 right-[0px] w-[1px] h-[42px] bg-slate-200 dark:bg-slate-700 z-[2]" />
              </div>
            ))}

          <RequestNode
            isOnboardingRequest={
              node.children
                ? node.children[0].trace === onBoardingRequestTrace
                : node.trace === onBoardingRequestTrace
            }
            selectedRequestId={selectedRequestId}
            node={node.children ? node.children[0] : node}
            setCloseChildren={setCloseChildren}
            closeChildren={closeChildren}
            setSelectedRequestId={setSelectedRequestId}
            level={level}
            isRequestSingleChild={isRequestSingleChild ?? false}
            label={node.children ? node.subPathName : undefined}
          />
        </Row>
      )}
    </div>
  );
};

function countAllLeavesInNode(node: TreeNodeData): number {
  if (!node.children || node.children.length === 0) {
    return node.trace?.request_id ? 1 : 0;
  }
  return node.children.reduce(
    (acc, child) => acc + countAllLeavesInNode(child),
    0
  );
}

interface TreeProps {
  data: TreeNodeData;
  className?: string;
  selectedRequestIdDispatch: [string, (x: string) => void];
  collapseAll?: boolean;
  onBoardingRequestTrace?: Trace;
  sessionId: string;
  isRealtime?: boolean;
  realtimeData?: {
    isRealtime: boolean;
    effectiveRequests: HeliconeRequest[];
    originalRequest: HeliconeRequest | null;
  };
}

export const Tree: React.FC<TreeProps> = ({
  data,
  className,
  selectedRequestIdDispatch,
  collapseAll,
  onBoardingRequestTrace,
  sessionId,
  isRealtime = false,
  realtimeData,
}) => {
  return (
    <div
      className={clsx(
        "font-sans bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-700",
        className
      )}
    >
      {data.children &&
        data.children.map((child, index) => (
          <TreeNode
            key={index}
            node={child}
            selectedRequestIdDispatch={selectedRequestIdDispatch}
            isLastChild={!!data.children && index === data.children.length - 1}
            level={0}
            collapseAll={collapseAll}
            onBoardingRequestTrace={onBoardingRequestTrace}
            realtimeData={
              realtimeData || {
                isRealtime,
                effectiveRequests: [],
                originalRequest: null,
              }
            }
          />
        ))}
    </div>
  );
};
