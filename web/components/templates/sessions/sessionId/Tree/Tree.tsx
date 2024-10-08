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
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  selectedRequestIdDispatch,
  isLastChild,
  level,
  collapseAll,
  setShowDrawer,
}) => {
  const [closeChildren, setCloseChildren] = useState(collapseAll ?? false);
  const [selectedRequestId, setSelectedRequestId] = selectedRequestIdDispatch;

  useEffect(() => {
    setCloseChildren(collapseAll ?? false);
  }, [collapseAll]);

  return (
    <div
      className={level === 0 ? "p-0 m-0" : "relative flex flex-col"}
      key={`${node.name}-${node.trace?.request_id}`}
    >
      {node.children ? (
        <Col className="overflow-x-auto overflow-y-hidden">
          <Row className="w-full group">
            {new Array(level).fill(null).map((_, index) => (
              <div
                key={index}
                className="h-9 bg-slate-50 w-[24px] relative shrink-0 group-hover:bg-slate-100 group-hover:cursor-pointer"
                onClick={() =>
                  node.children
                    ? setCloseChildren(!closeChildren)
                    : setSelectedRequestId(node.trace?.request_id ?? "")
                }
              >
                <div className="absolute top-0 right-[0px] w-[1px] h-9 bg-slate-200 z-[2]" />
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
              />
            ))}
        </Col>
      ) : (
        <Row className="w-full group">
          <div
            className={clsx(
              "h-[42px] w-[24px]  shrink-0 group-hover:cursor-pointer sticky top-1/2 left-0 z-[2]",
              selectedRequestId === node.trace?.request_id
                ? "bg-sky-100"
                : "bg-white group-hover:bg-sky-50"
            )}
            onClick={() =>
              node.children
                ? setCloseChildren(!closeChildren)
                : setSelectedRequestId(node.trace?.request_id ?? "")
            }
          >
            <div className="absolute top-0 right-[0px] w-[1px] h-[42px] bg-slate-200 z-[2]" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    className={clsx(
                      "p-1 m-0 flex items-center hidden group-hover:block z-[20]",
                      selectedRequestId === node.trace?.request_id
                        ? "bg-sky-100 hover:bg-sky-100"
                        : "bg-sky-50 hover:bg-sky-50"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequestId(node.trace?.request_id ?? "");
                      setShowDrawer(true);
                    }}
                  >
                    <SidebarCloseIcon className="w-4 h-4 text-slate-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View request</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {new Array(level - 1).fill(null).map((_, index) => (
            <div
              key={index}
              className={clsx(
                "h-[42px] w-[24px] relative shrink-0 group-hover:cursor-pointer",
                selectedRequestId === node.trace?.request_id
                  ? "bg-sky-100"
                  : "bg-white group-hover:bg-sky-50"
              )}
              onClick={() =>
                node.children
                  ? setCloseChildren(!closeChildren)
                  : setSelectedRequestId(node.trace?.request_id ?? "")
              }
            >
              <div className="absolute top-0 right-[0px] w-[1px] h-[42px] bg-slate-200 z-[2]" />
            </div>
          ))}
          <RequestNode
            selectedRequestId={selectedRequestId}
            node={node}
            setCloseChildren={setCloseChildren}
            closeChildren={closeChildren}
            setSelectedRequestId={setSelectedRequestId}
            level={level}
            setShowDrawer={setShowDrawer}
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
      "font-sans bg-slate-50 border-t border-slate-200",
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
