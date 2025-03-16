import LoadingAnimation from "@/components/shared/loadingAnimation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Muted } from "@/components/ui/typography";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { heliconeRequestToMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { FlaskConicalIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo } from "react";
import { PiPlayBold } from "react-icons/pi";
import { useGetRequestWithBodies } from "../../../services/hooks/requests";
import { useOrg } from "../../layout/org/organizationContext";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedDiv from "../../shared/themed/themedDiv";
import RequestRow from "./requestRow";

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
  const org = useOrg();
  const jawn = useJawnClient();

  // Fetch the full request body only when the component is opened and we have a request ID
  const {
    data: requestWithBody,
    isLoading: isLoadingFullRequest,
    error: requestError,
  } = useGetRequestWithBodies(open && !!request?.id ? request?.id || "" : "");

  const fullRequest = useMemo(() => {
    if (open && requestWithBody?.data && !isLoadingFullRequest) {
      // Convert the HeliconeRequest to MappedLLMRequest
      return heliconeRequestToMappedContent(requestWithBody.data);
    }
    return request;
  }, [open, requestWithBody, isLoadingFullRequest, request]);

  const setOpenHandler = useCallback(
    (divOpen: boolean) => {
      setOpen(divOpen);
      if (!divOpen) {
        const { pathname, query } = router;
        if (router.query.requestId) {
          delete router.query.requestId;
          router.replace({ pathname, query }, undefined, { shallow: true });
        }
      }
    },
    [router, setOpen]
  );

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

  const promptId = useMemo(
    () =>
      fullRequest?.heliconeMetadata.customProperties?.["Helicone-Prompt-Id"] ??
      null,
    [fullRequest?.heliconeMetadata.customProperties]
  );

  const promptDataQuery = useQuery({
    queryKey: ["prompt", promptId, org?.currentOrg?.id],
    queryFn: async (query) => {
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
    enabled: !!promptId && !!org?.currentOrg?.id,
  });

  const handleCopyToClipboard = useCallback(() => {
    try {
      navigator.clipboard.writeText(
        JSON.stringify(fullRequest?.schema || {}, null, 4)
      );
      setNotification("Copied to clipboard", "success");
    } catch (error) {
      setNotification("Failed to copy to clipboard", "error");
    }
  }, [fullRequest?.schema, setNotification]);

  const handleCreateExperiment = useCallback(() => {
    if (!fullRequest?.id) return;

    jawn
      .POST("/v2/experiment/create/from-request/{requestId}", {
        params: {
          path: {
            requestId: fullRequest.id,
          },
        },
      })
      .then((res) => {
        if (res.error || !res.data.data?.experimentId) {
          setNotification("Failed to create experiment", "error");
          return;
        }
        router.push(`/experiments/${res.data.data?.experimentId}`);
      })
      .catch(() => {
        setNotification("Failed to create experiment", "error");
      });
  }, [fullRequest?.id, jawn, router, setNotification]);

  const handleTestPrompt = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      if (promptDataQuery.data?.id) {
        router.push(`/prompts/${promptDataQuery.data?.id}`);
      } else if (fullRequest) {
        router.push(`/prompts/fromRequest/${fullRequest.id}`);
      }
    },
    [promptDataQuery.data?.id, fullRequest, router]
  );

  return (
    <ThemedDiv
      open={open}
      setOpen={setOpenHandler}
      actions={
        <div className="w-full flex flex-row justify-between items-center">
          <div className="flex flex-row items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="#"
                  onClick={handleTestPrompt}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400 inline-block"
                >
                  <PiPlayBold className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Test Prompt</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400 inline-block"
                  onClick={handleCreateExperiment}
                  disabled={!fullRequest?.id}
                >
                  <FlaskConicalIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Experiment</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopyToClipboard}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400"
                  disabled={!fullRequest?.schema}
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Copy</TooltipContent>
            </Tooltip>
          </div>
          {(hasPrevious || hasNext) && (
            <div className="flex flex-row items-center space-x-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onPrevHandler}
                    disabled={!hasPrevious}
                    className={clsx(
                      !hasPrevious && "opacity-50 hover:cursor-not-allowed",
                      "hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400"
                    )}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Previous</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onNextHandler}
                    disabled={!hasNext}
                    className={clsx(
                      !hasNext && "opacity-50 hover:cursor-not-allowed",
                      "hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400"
                    )}
                  >
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Next</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      }
    >
      {isLoadingFullRequest ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Muted>Loading full request details...</Muted>
          <LoadingAnimation />
        </div>
      ) : requestError ? (
        <div className="flex flex-col items-center justify-center h-full">
          <Muted>Error loading request</Muted>
        </div>
      ) : fullRequest ? (
        <RequestRow
          request={fullRequest}
          properties={properties}
          open={open}
          promptData={promptDataQuery.data}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <Muted>No request data available</Muted>
        </div>
      )}
    </ThemedDiv>
  );
};

export default RequestDiv;
