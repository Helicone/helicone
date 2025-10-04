import { Col, Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarCloseIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
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
        level === 0 ? "m-0 p-0" : "relative flex flex-col",
        "bg-white dark:bg-slate-950",
      )}
      key={`${node.subPathName}-${node.trace?.request_id}`}
    >
      {!node.trace &&
      node.children &&
      (node.children.filter((c) => !c.trace).length ||
        node.children.filter((c) => c.trace).length === 0 ||
        node.children.filter((c) => c.trace).length > 1) ? (
        <Col className="overflow-x-auto overflow-y-hidden">
          <Row className="group w-full">
            {new Array(level).fill(null).map((_, index) => (
              <div
                key={index}
                className="relative h-9 w-[24px] shrink-0 bg-slate-50 group-hover:cursor-pointer group-hover:bg-slate-100 dark:bg-slate-950 dark:group-hover:bg-slate-900"
                onClick={() =>
                  node.children
                    ? setCloseChildren(!closeChildren)
                    : setSelectedRequestId(node.trace?.request_id ?? "")
                }
              >
                <div className="absolute right-[0px] top-0 z-[2] h-9 w-[1px] bg-slate-200 dark:bg-slate-700" />
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
        <Row className="group w-full">
          <div
            className={clsx(
              "sticky left-0 top-1/2 z-[2] h-[42px] w-[24px] shrink-0 group-hover:cursor-pointer",
              selectedRequestId ===
                (node.children
                  ? node.children[0].trace?.request_id
                  : node.trace?.request_id)
                ? "bg-sky-100 dark:bg-slate-900"
                : "bg-white group-hover:bg-sky-50 dark:bg-slate-950 dark:group-hover:bg-slate-800",
            )}
            onClick={() =>
              node.children
                ? setSelectedRequestId(node.children[0].trace?.request_id ?? "")
                : setSelectedRequestId(node.trace?.request_id ?? "")
            }
          >
            <div className="absolute right-[0px] top-0 z-[2] h-[42px] w-[1px] bg-slate-200 dark:bg-slate-700" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    className={clsx(
                      "z-[20] m-0 hidden items-center p-1 group-hover:flex",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequestId(
                        node.children
                          ? (node.children[0].trace?.request_id ?? "")
                          : (node.trace?.request_id ?? ""),
                      );
                    }}
                  >
                    <SidebarCloseIcon className="h-4 w-4 text-slate-500" />
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
                  "relative h-[42px] w-[24px] shrink-0 group-hover:cursor-pointer",
                  selectedRequestId ===
                    (node.children
                      ? node.children[0].trace?.request_id
                      : node.trace?.request_id)
                    ? "bg-sky-100 dark:bg-slate-900"
                    : "bg-white group-hover:bg-sky-50 dark:bg-slate-950 dark:group-hover:bg-slate-900",
                )}
                onClick={() =>
                  node.children
                    ? setSelectedRequestId(
                        node.children[0].trace?.request_id ?? "",
                      )
                    : setSelectedRequestId(node.trace?.request_id ?? "")
                }
              >
                <div className="absolute right-[0px] top-0 z-[2] h-[42px] w-[1px] bg-slate-200 dark:bg-slate-700" />
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
    0,
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
        "font-sans border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-black",
        className,
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
