import { useOrg } from "@/components/layout/org/organizationContext";
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
import { FlaskConicalIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { PiPlayBold } from "react-icons/pi";
import { useCreatePromptFromRequest } from "../../../services/hooks/prompts/prompts";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import RequestRow from "./requestRow";

interface RequestDrawerV2Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevHandler?: () => void;
  onNextHandler?: () => void;
  request?: MappedLLMRequest;
  properties?: string[];
}

const RequestDrawerV2 = (props: RequestDrawerV2Props) => {
  const {
    open,
    setOpen,
    hasPrevious,
    hasNext,
    onPrevHandler,
    onNextHandler,
    request,
    properties: propsProperties,
  } = props;

  const { setNotification } = useNotification();
  const router = useRouter();
  const org = useOrg();
  const jawn = useJawnClient();
  const createPrompt = useCreatePromptFromRequest();

  const properties = useMemo(
    () =>
      ((propsProperties?.length ?? 0) > 0
        ? propsProperties
        : Object.keys(request?.heliconeMetadata.customProperties ?? {})) ?? [],
    [request, propsProperties]
  );
  const setOpenHandler = (drawerOpen: boolean) => {
    // if the drawerOpen boolean is true, open the drawer
    if (drawerOpen) {
      setOpen(true);
    }
    // if the drawerOpen boolean is false, close the drawer and clear the requestId
    else {
      setOpen(false);
      const { pathname, query } = router;
      // only delete and replace if the request id exists in the router
      if (router.query.requestId) {
        delete router.query.requestId;
        router.replace({ pathname, query }, undefined, { shallow: true });
      }
    }
  };

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
    <ThemedDrawer
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
                    if (promptDataQuery.data?.id) {
                      router.push(`/prompts/${promptDataQuery.data?.id}`);
                    } else if (request) {
                      router.push(`/prompts/fromRequest/${request.id}`);
                    }
                  }}
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400"
                >
                  <PiPlayBold className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Test Prompt</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
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
                  className="hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1 text-slate-700 dark:text-slate-400"
                >
                  <FlaskConicalIcon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Experiment</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    setNotification("Copied to clipboard", "success");
                    const copy = { ...request };
                    navigator.clipboard.writeText(
                      JSON.stringify(copy || {}, null, 4)
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
    </ThemedDrawer>
  );
};

export default RequestDrawerV2;
