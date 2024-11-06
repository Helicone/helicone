import { useRef, useState, useEffect, useMemo } from "react";
import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { Row } from "../../../../layout/common/row";
import StatusBadge from "../../../requestsV2/statusBadge";
import { clsx } from "../../../../shared/clsx";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useOnboardingContext from "@/components/layout/onboardingContext";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { WorkflowIcon } from "lucide-react";
import OnboardingPopover from "@/components/templates/onboarding/OnboardingPopover";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/components/layout/organizationContext";
import { getJawnClient } from "@/lib/clients/jawn";

export function RequestNode(props: {
  isOnboardingRequest: boolean;
  isRequestSingleChild: boolean;
  selectedRequestId: string;
  node: TreeNodeData;
  setCloseChildren: React.Dispatch<React.SetStateAction<boolean>>;
  closeChildren: boolean;
  setSelectedRequestId: (x: string) => void;
  level: number;
  setShowDrawer: (x: boolean) => void;
}) {
  const { isOnboardingRequest, node } = props;

  const promptId = useMemo(() => {
    return node.trace?.request.customProperties?.["Helicone-Prompt-Id"] as
      | string
      | undefined;
  }, [node.trace?.request.customProperties]);

  // const {
  //   isOnboardingRequest,
  //   isRequestSingleChild,
  //   selectedRequestId,
  //   node,
  //   setCloseChildren,
  //   closeChildren,
  //   setSelectedRequestId,
  //   level,
  //   setShowDrawer,
  // } = props;

  // const modelRef = useRef<HTMLDivElement>(null);
  // const [isTruncated, setIsTruncated] = useState(false);

  // useEffect(() => {
  //   const el = modelRef.current;
  //   if (el) {
  //     setIsTruncated(el.scrollWidth > el.clientWidth);
  //   }
  // }, [node.trace?.request.model]);

  const {
    currentStep,
    setCurrentStep,
    setCurrentElementId,
    isOnboardingVisible,
  } = useOnboardingContext();

  const router = useRouter();

  const org = useOrg();

  const promptData = useQuery({
    queryKey: ["prompt", promptId, org?.currentOrg?.id],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[2]);
      const prompt = await jawn.POST("/v1/prompt/query", {
        body: {
          filter: {
            prompt_v2: {
              user_defined_id: {
                equals: query.queryKey[1],
              },
            },
          },
        },
      });
      return prompt.data?.data?.[0];
    },
  });

  if (isOnboardingRequest && currentStep === 3 && isOnboardingVisible) {
    return (
      <Popover open={true}>
        <PopoverTrigger>
          <RequestNodeRow {...props} />
        </PopoverTrigger>
        <OnboardingPopover
          id="onboarding-request-session-culprit"
          icon={<WorkflowIcon className="h-6 w-6" />}
          title="The culprit"
          stepNumber={2}
          description={
            <>
              Tracing the session made it clear that the problem happened during
              the <strong>“extract-travel-plan”</strong> step. Let&apos;s go
              improve this prompt.
            </>
          }
          next={() => {
            setCurrentElementId("onboarding-prompt");
            setCurrentStep(5);
            router.push(`/prompts/${promptData.data?.id}`);
          }}
          align="start"
          side="right"
          className="z-[10000] bg-white p-4 w-[calc(100vw-2rem)] sm:max-w-md flex flex-col gap-2"
        />
      </Popover>
    );
  }

  return <RequestNodeRow {...props} />;
}

export function RequestNodeRow(props: {
  isOnboardingRequest: boolean;
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
    isOnboardingRequest,
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
    <div
      id={isOnboardingRequest ? "onboarding-request-session-culprit" : ""}
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
  );
}
