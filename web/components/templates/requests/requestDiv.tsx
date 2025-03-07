import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { P, Small } from "@/components/ui/typography";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { useQuery } from "@tanstack/react-query";
import { FlaskConical, ThumbsUp, ThumbsDown, Plus, ScrollText } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useOrg } from "../../layout/org/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedDiv from "../../shared/themed/themedDiv";
import CostPill from "./costPill";
import RequestRow from "./requestRow";
import StatusBadge from "./statusBadge";
import { formatNumber } from "../../shared/utils/formatNumber";
import { useCreatePrompt } from "@/services/hooks/prompts/prompts";

interface RequestDivProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevHandler?: () => void;
  onNextHandler?: () => void;
  request?: MappedLLMRequest;
  properties: string[];
}

const RequestDiv = (props: RequestDivProps) => {
  const {
    open,
    setOpen,
    hasPrevious,
    hasNext,
    onPrevHandler,
    onNextHandler,
    request,
    properties,
  } = props;

  const { setNotification } = useNotification();
  const router = useRouter();
  const createPrompt = useCreatePrompt();
  const [newDatasetModalOpen, setNewDatasetModalOpen] = useState(false);

  const org = useOrg();

  const setOpenHandler = (divOpen: boolean) => {
    setOpen(divOpen);
    if (!divOpen) {
      const { pathname, query } = router;
      if (router.query.requestId) {
        delete router.query.requestId;
        router.replace({ pathname, query }, undefined, { shallow: true });
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        onPrevHandler?.();
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        onNextHandler?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onNextHandler, onPrevHandler, setOpen]);

  const jawn = useJawnClient();

  const promptId = useMemo(
    () =>
      request?.heliconeMetadata.customProperties?.["Helicone-Prompt-Id"] ??
      null,
    [request?.heliconeMetadata.customProperties]
  );
  const promptDataQuery = useQuery({
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

  // Bottom Bar of the Request Drawer
  const renderFooter = () => {
    if (request) {
      return (
        <div className="w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => {/* Add test prompt handler */ }}
              >
                <ScrollText size={16} />
                Test Prompt
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Add experiment handler */ }}
              >
                <FlaskConical size={16} className="mr-2" />
                Experiment
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setNewDatasetModalOpen(true)}
              >
                <Plus size={16} />
                Dataset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ThumbsUp size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Helpful</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ThumbsDown size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Not Helpful</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (request) {
      return (
        <div className="w-full">
          <RequestRow
            request={request}
            properties={properties}
            open={open}
            promptData={promptDataQuery.data}
          />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
          <P className="text-muted-foreground">Loading request data...</P>
        </div>
      </div>
    );
  };

  // Top Bar of the Request Drawer
  const renderActions = () => {
    return (
      <div className="flex justify-between items-center w-full">
        {request && (
          <div className="flex items-center gap-2">
            {/* Cost Badge */}
            <div className="flex items-center">
              {request.heliconeMetadata.cost !== null &&
                request.heliconeMetadata.cost !== undefined &&
                request.heliconeMetadata.cost > 0 ? (
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 ring-1 ring-inset ring-border">
                  <Small className="text-xs text-muted-foreground">${formatNumber(request.heliconeMetadata.cost || 0)}</Small>
                </span>
              ) : request.heliconeMetadata.status.statusType === "success" ? (
                <CostPill />
              ) : (
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 ring-1 ring-inset ring-border">
                  <Small className="text-xs text-muted-foreground">N/A</Small>
                </span>
              )}
            </div>

            {/* Latency Badge */}
            <div className="flex items-center">
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 ring-1 ring-inset ring-border">
                <Small className="text-xs text-muted-foreground">{Number(request.heliconeMetadata.latency || 0) / 1000}s</Small>
              </span>
            </div>

            {/* Status Badge */}
            <div className="flex items-center">
              <StatusBadge
                statusType={request.heliconeMetadata.status.statusType}
                errorCode={request.heliconeMetadata.status.code}
                className="text-xs"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ThemedDiv
      open={open}
      setOpen={setOpenHandler}
      actions={renderActions()}
      footer={renderFooter()}
    >
      {renderContent()}
    </ThemedDiv>
  );
};

export default RequestDiv;
