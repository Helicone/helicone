import { useEffect, useState } from "react";
import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { clsx } from "../../../../shared/clsx";
import { PathNode } from "./PathNode";
import { RequestNode } from "./RequestNode";
import { Col, Row } from "@/components/layout/common";
import { SidebarCloseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TreeNodeProps {
  node: TreeNodeData;
  selectedRequestIdDispatch: [string, (x: string) => void];
  isLastChild: boolean;
  level: number;
  collapseAll?: boolean;
  setShowDrawer: (x: boolean) => void;
  isRequestSingleChild?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  selectedRequestIdDispatch,
  isLastChild,
  level,
  collapseAll,
  setShowDrawer,
  isRequestSingleChild,
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
      key={`${node.name}-${node.trace?.request_id}`}
    >
      {node.children && node.children.length > 1 ? (
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
                key={index}
                node={child}
                selectedRequestIdDispatch={selectedRequestIdDispatch}
                isLastChild={
                  node.children?.length
                    ? index === node.children?.length - 1
                    : false
                }
                level={level + 1}
                setShowDrawer={setShowDrawer}
                isRequestSingleChild={node?.children?.length === 1}
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
                      "p-1 m-0 flex items-center hidden group-hover:block z-[20]"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequestId(
                        node.children
                          ? node.children[0].trace?.request_id ?? ""
                          : node.trace?.request_id ?? ""
                      );
                      setShowDrawer(true);
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
                  selectedRequestId === node.trace?.request_id
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
            selectedRequestId={selectedRequestId}
            node={node.children ? node.children[0] : node}
            setCloseChildren={setCloseChildren}
            closeChildren={closeChildren}
            setSelectedRequestId={setSelectedRequestId}
            level={level}
            setShowDrawer={setShowDrawer}
            isRequestSingleChild={isRequestSingleChild ?? false}
          />
        </Row>
      )}
    </div>
  );
};
interface TreeProps {
  data: TreeNodeData;
  className?: string;
  selectedRequestIdDispatch: [string, (x: string) => void];
  collapseAll?: boolean;
  setShowDrawer: (x: boolean) => void;
}

export const Tree: React.FC<TreeProps> = ({
  data,
  className,
  selectedRequestIdDispatch,
  collapseAll,
  setShowDrawer,
}) => (
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
          setShowDrawer={setShowDrawer}
        />
      ))}
  </div>
);
