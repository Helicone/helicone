import { useOrg } from "@/components/layout/org/organizationContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { TreeNodeData } from "../../../../../lib/sessions/sessionTypes";
import { Row } from "../../../../layout/common/row";
import { clsx } from "../../../../shared/clsx";
import StatusBadge from "../../../requests/statusBadge";

// Unified data structure for request types
const REQUEST_TYPE_CONFIG = {
  LLM: {
    bgColor: "bg-sky-200 dark:bg-sky-900 text-sky-700 dark:text-sky-200",
    displayName: "LLM",
  },
  tool: {
    bgColor:
      "bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-200",
    displayName: "Tool",
  },
  vector_db: {
    bgColor:
      "bg-orange-200 dark:bg-orange-900 text-orange-700 dark:text-orange-200",
    displayName: "Vector DB",
  },
};

export function RequestNode(props: {
  isOnboardingRequest: boolean;
  isRequestSingleChild: boolean;
  selectedRequestId: string;
  node: TreeNodeData;
  setCloseChildren: React.Dispatch<React.SetStateAction<boolean>>;
  closeChildren: boolean;
  setSelectedRequestId: (x: string) => void;
  level: number;
  label?: string;
}) {
  const {
    node,
    isRequestSingleChild,
    selectedRequestId,
    setCloseChildren,
    closeChildren,
    setSelectedRequestId,
    level,
    label,
  } = props;

  const promptId = useMemo(() => {
    return node.trace?.request.heliconeMetadata?.customProperties?.[
      "Helicone-Prompt-Id"
    ] as string | undefined;
  }, [node.trace?.request.heliconeMetadata.customProperties]);

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

  const modelRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = modelRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [node.trace?.request.model]);

  const type = node.trace?.request.model.startsWith("tool:")
    ? "tool"
    : node.trace?.request.model.startsWith("vector_db")
      ? "vector_db"
      : "LLM";

  // Get the actual model name for display
  const getModelName = () => {
    if (type === "tool") {
      return node.trace?.request.model.split(":")[1];
    } else if (type === "vector_db") {
      return (
        (node.trace?.request.raw.request as any).operation ??
        node.trace?.request.model
      );
    } else {
      return node.trace?.request.model;
    }
  };

  return (
    <div
      className={clsx(
        "flex w-full flex-col px-4 py-[8px] pl-4 group-hover:cursor-pointer dark:bg-slate-900",
        selectedRequestId === node.trace?.request_id
          ? "bg-sky-100 hover:bg-sky-100 dark:bg-slate-900 dark:hover:bg-slate-800"
          : "bg-white group-hover:bg-sky-50 dark:bg-slate-950 dark:group-hover:bg-slate-800",
      )}
      onClick={() =>
        node.children
          ? setCloseChildren(!closeChildren)
          : setSelectedRequestId(node.trace?.request_id ?? "")
      }
    >
      <Row className="w-full items-center gap-2">
        <Row className="min-w-0 flex-grow items-center gap-2">
          <div
            className={clsx(
              "flex-shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium",
              REQUEST_TYPE_CONFIG[type as keyof typeof REQUEST_TYPE_CONFIG]
                .bgColor,
            )}
          >
            {
              REQUEST_TYPE_CONFIG[type as keyof typeof REQUEST_TYPE_CONFIG]
                .displayName
            }
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                ref={modelRef}
                className="flex-shrink-1 min-w-[100px] max-w-[200px] flex-grow truncate rounded-md bg-transparent px-2 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-200"
              >
                {label ?? getModelName()}
              </div>
            </TooltipTrigger>
            {isTruncated && (
              <TooltipContent>
                <span>{node.trace?.request.model}</span>
              </TooltipContent>
            )}
          </Tooltip>
          <span className="whitespace-nowrap text-[11px] text-slate-400 dark:text-slate-600">
            {isRequestSingleChild ? "" : `(${node.latency})`}
          </span>
        </Row>
        <Row className="flex-shrink-0 items-center gap-2">
          {node.trace?.request.heliconeMetadata?.status && (
            <StatusBadge
              statusType={
                node.trace?.request.heliconeMetadata.status.statusType
              }
              errorCode={node.trace?.request.heliconeMetadata.status.code}
            />
          )}
        </Row>
      </Row>
    </div>
  );
}
