import { useEffect, useState } from "react";
import { Trace, TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { clsx } from "../../../../shared/clsx";
import { PathNode } from "./PathNode";
import { RequestNode } from "./RequestNode";
import { Col, Row } from "@/components/layout/common";
import { SidebarCloseIcon, WorkflowIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useOnboardingContext from "@/components/layout/onboardingContext";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import OnboardingPopover from "@/components/templates/onboarding/OnboardingPopover";

export interface TreeNodeProps {
  node: TreeNodeData;
  selectedRequestIdDispatch: [string, (x: string) => void];
  isLastChild: boolean;
  level: number;
  collapseAll?: boolean;
  setShowDrawer: (x: boolean) => void;
  isRequestSingleChild?: boolean;
  onBoardingRequestTrace?: Trace;
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
      {node.children ? (
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
              selectedRequestId === node.trace?.request_id
                ? "bg-sky-100 dark:bg-slate-900"
                : "bg-white dark:bg-slate-950 group-hover:bg-sky-50 dark:group-hover:bg-slate-800"
            )}
            onClick={() =>
              node.children
                ? setCloseChildren(!closeChildren)
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
                      setSelectedRequestId(node.trace?.request_id ?? "");
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
                    ? setCloseChildren(!closeChildren)
                    : setSelectedRequestId(node.trace?.request_id ?? "")
                }
              >
                <div className="absolute top-0 right-[0px] w-[1px] h-[42px] bg-slate-200 dark:bg-slate-700 z-[2]" />
              </div>
            ))}

          <RequestNode
            isOnboardingRequest={
              onBoardingRequestTrace?.request_id === node.trace?.request_id
            }
            selectedRequestId={selectedRequestId}
            node={node}
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
  onBoardingRequestTrace?: Trace;
}

export const Tree: React.FC<TreeProps> = ({
  data,
  className,
  selectedRequestIdDispatch,
  collapseAll,
  setShowDrawer,
  onBoardingRequestTrace,
}) => {
  const { currentStep, isOnboardingVisible } = useOnboardingContext();

  // find the first request that is a request node (children can have multiple children)
  const firstRequest = data.children?.find(
    (child) => child.name === "request"
  ) as TreeNodeData;

  if (isOnboardingVisible && currentStep === 2) {
    return (
      <Popover open={true}>
        <PopoverTrigger asChild>
          <div
            className={clsx(
              "font-sans bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-slate-700",
              className
            )}
            data-onboarding-step={2}
          >
            {data.children &&
              data.children.map((child, index) => (
                <TreeNode
                  key={index}
                  node={child}
                  selectedRequestIdDispatch={selectedRequestIdDispatch}
                  onBoardingRequestTrace={onBoardingRequestTrace}
                  isLastChild={
                    !!data.children && index === data.children.length - 1
                  }
                  level={0}
                  collapseAll={collapseAll}
                  setShowDrawer={setShowDrawer}
                />
              ))}
          </div>
        </PopoverTrigger>
        <OnboardingPopover
          icon={<WorkflowIcon className="h-6 w-6" />}
          title="We are in the travel planning session"
          stepNumber={2}
          description="The goal is to figure out where the original failure occured."
          next={() => {
            selectedRequestIdDispatch[1](
              onBoardingRequestTrace?.request_id ?? ""
            );
          }}
          align="start"
          side="right"
          className="z-[10000] bg-white p-4 w-[calc(100vw-2rem)] sm:max-w-md flex flex-col gap-2"
        />
      </Popover>
    );
  }

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
            onBoardingRequestTrace={onBoardingRequestTrace}
            level={0}
            collapseAll={collapseAll}
            setShowDrawer={setShowDrawer}
          />
        ))}
    </div>
  );
};
