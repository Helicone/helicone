import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/20/solid";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { FlaskConicalIcon, NotepadText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo } from "react";
import { createPromptFromRequest } from "../../../services/hooks/prompts/prompts";
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
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!request) return;
                    if (promptDataQuery.data?.id) {
                      router.push(`/prompts/${promptDataQuery.data?.id}`);
                    } else {
                      await createPromptFromRequest(
                        jawn,
                        request.schema.request,
                        router,
                        setNotification
                      );
                    }
                  }}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400 inline-block"
                >
                  <NotepadText className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Test Prompt</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400 inline-block"
                  onClick={() => {
                    jawn
                      .POST("/v2/experiment/create/from-request/{requestId}", {
                        params: {
                          path: {
                            requestId: request?.id!,
                          },
                        },
                      })
                      .then((res) => {
                        if (res.error || !res.data.data?.experimentId) {
                          setNotification(
                            "Failed to create experiment",
                            "error"
                          );
                          return;
                        }
                        router.push(
                          `/experiments/${res.data.data?.experimentId}`
                        );
                      });
                  }}
                >
                  <FlaskConicalIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Experiment</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setNotification("Copied to clipboard", "success");
                    navigator.clipboard.writeText(
                      JSON.stringify(request?.schema || {}, null, 4)
                    );
                  }}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400"
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
      {request ? (
        <RequestRow
          request={request}
          properties={properties}
          open={open}
          promptData={promptDataQuery.data}
        />
      ) : (
        <p>Loading...</p>
      )}
    </ThemedDiv>
  );
};

export default RequestDiv;
