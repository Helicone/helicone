import { useEffect, useState } from "react";
import { HeliconeRequest } from "../../../../../lib/api/request/request";
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
  setShowDrawer: (x: boolean) => void;
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
  isLastChild,
  level,
  collapseAll,
  setShowDrawer,
  isRequestSingleChild,
  onBoardingRequestTrace,
  realtimeData,
}) => {
  const [closeChildren, setCloseChildren] = useState(collapseAll ?? false);
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;
  const isRealtime = realtimeData?.isRealtime || false;

  useEffect(() => {
    setCloseChildren(collapseAll ?? false);
  }, [collapseAll]);

  return (
    <div
      className={clsx(
        level === 0 ? "p-0 m-0" : "relative flex flex-col",
        "bg-white dark:bg-slate-950"
      )}
      key={`${node.name}-${node.trace?.request_id}`}
    >
      {level > 0 && (
        <div
          className={clsx(
            "absolute h-full w-4 flex flex-col items-center",
            {
              "h-1/2 top-0": isLastChild && !node.children?.length,
              "top-0": !(!node.children?.length && isLastChild),
            },
            "-left-5"
          )}
        >
          <div
            className={clsx(
              "w-[1px] bg-slate-200 dark:bg-slate-800 flex-1",
              level === 1 ? "ml-4" : ""
            )}
          ></div>
        </div>
      )}
      {/* Horizontal line for every node */}
      {level > 0 && (
        <div
          className={clsx(
            "absolute top-6 -left-5 w-4 h-[1px] bg-slate-200 dark:bg-slate-800"
          )}
        ></div>
      )}
      {level === 0 &&
      (node.children?.length === 1 ||
        (node.children?.length === 0 && node.trace?.request_id)) ? (
        <div className="ml-7 tree-child-container">
          {node.children?.length === 1 ? (
            <TreeNode
              node={node.children[0]}
              selectedRequestIdDispatch={selectedRequestIdDispatch}
              isLastChild={true}
              level={level + 1}
              key={0}
              collapseAll={collapseAll}
              setShowDrawer={setShowDrawer}
              isRequestSingleChild={true}
              onBoardingRequestTrace={onBoardingRequestTrace}
              realtimeData={realtimeData}
            />
          ) : (
            // Show node if its a request
            node.trace?.request_id && (
              <RequestNode
                requestId={node.trace.request_id}
                path={node.name}
                selectedRequestIdDispatch={selectedRequestIdDispatch}
                className="mb-2"
                onBoardingRequestTrace={onBoardingRequestTrace}
                isRequestSingleChild={true}
                realtimeData={realtimeData}
              />
            )
          )}
        </div>
      ) : (
        // This is shown for every node unless its a request
        <div className="w-full">
          {node.trace?.request_id ? (
            <RequestNode
              requestId={node.trace.request_id}
              path={node.name}
              selectedRequestIdDispatch={selectedRequestIdDispatch}
              className="mb-2"
              onBoardingRequestTrace={onBoardingRequestTrace}
              isRequestSingleChild={isRequestSingleChild}
              realtimeData={realtimeData}
            />
          ) : (
            // path node is for intermediate nodes - ones that aren't already request nodes
            <PathNode
              name={node.name ?? ""}
              count={
                countAllLeavesInNode(node) === 0
                  ? node.children?.length ?? 0
                  : countAllLeavesInNode(node)
              }
              onClose={() => setCloseChildren(!closeChildren)}
              isClosed={closeChildren}
            />
          )}
          {!closeChildren && node.children && (
            // Show all children
            <div
              className={clsx(
                "ml-7 tree-child-container",
                level === 0 ? "border-0" : ""
              )}
            >
              {node.children.map((child, i) => (
                <TreeNode
                  node={child}
                  selectedRequestIdDispatch={selectedRequestIdDispatch}
                  isLastChild={i === node.children!.length - 1}
                  level={level + 1}
                  key={i}
                  collapseAll={collapseAll}
                  setShowDrawer={setShowDrawer}
                  onBoardingRequestTrace={onBoardingRequestTrace}
                  realtimeData={realtimeData}
                />
              ))}
            </div>
          )}
        </div>
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
  setShowDrawer: (x: boolean) => void;
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
  setShowDrawer,
  onBoardingRequestTrace,
  sessionId,
  isRealtime = false,
  realtimeData,
}) => {
  return (
    <div className={clsx("tree-container", className)}>
      <TreeNode
        node={data}
        selectedRequestIdDispatch={selectedRequestIdDispatch}
        isLastChild={true}
        level={0}
        collapseAll={collapseAll}
        setShowDrawer={setShowDrawer}
        onBoardingRequestTrace={onBoardingRequestTrace}
        realtimeData={
          realtimeData || {
            isRealtime,
            effectiveRequests: [],
            originalRequest: null,
          }
        }
      />
    </div>
  );
};
