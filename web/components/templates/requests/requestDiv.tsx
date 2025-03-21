import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { P } from "@/components/ui/typography";
import { getJawnClient } from "@/lib/clients/jawn";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { useCreatePrompt } from "@/services/hooks/prompts/prompts";
import { ClipboardDocumentIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { FlaskConicalIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { LuEllipsis, LuPanelRightClose } from "react-icons/lu";
import { PiPlayBold } from "react-icons/pi";
import {
  addRequestLabel,
  addRequestScore,
} from "../../../services/lib/requests";
import { useOrg } from "../../layout/org/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { formatNumber } from "../../shared/utils/formatNumber";
import NewDataset from "../datasets/NewDataset";
import FeedbackButtons from "../feedback/thumbsUpThumbsDown";
import { RenderMappedRequest } from "./RenderHeliconeRequest";
import ScrollableRow from "./ScrollableRow";
import StatusBadge from "./statusBadge";

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
  const org = useOrg();
  const jawn = useJawnClient();

  const [showDetails, setShowDetails] = useState(false);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isScoresAddingLabel, setIsScoresAddingLabel] = useState(false);
  const [isScoresAdding, setIsScoresAdding] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDatasetModalOpen, setNewDatasetModalOpen] = useState(false);
  const [currentProperties, setCurrentProperties] =
    useState<{ [key: string]: string }[]>();
  const [currentScores, setCurrentScores] = useState<Record<string, number>>();

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

  useEffect(() => {
    if (!request) return;

    const currentProperties: { [key: string]: string }[] = [];
    properties.forEach((property) => {
      if (
        request.heliconeMetadata.customProperties &&
        request.heliconeMetadata.customProperties.hasOwnProperty(property)
      ) {
        currentProperties.push({
          [property]: request.heliconeMetadata.customProperties[
            property
          ] as string,
        });
      }
    });

    setCurrentProperties(currentProperties);
    const currentScores: Record<string, number> =
      (request.heliconeMetadata.scores as Record<string, number>) || {};
    setCurrentScores(currentScores);
  }, [properties, request]);

  const onAddPropertyHandler = async (key: string, value: string) => {
    if (!org?.currentOrg?.id) {
      setNotification("Error adding label", "error");
      return;
    }

    try {
      const res = await addRequestLabel(
        request!.id,
        org.currentOrg.id,
        key,
        value
      );

      if (res?.status === 200) {
        setNotification("Label added", "success");
        setCurrentProperties(
          currentProperties
            ? [...currentProperties, { [key]: value }]
            : [{ [key]: value }]
        );
      } else {
        setNotification("Error adding label", "error");
      }
    } catch (err) {
      console.error(err);
      setNotification(`Error adding label: ${err}`, "error");
    }
  };

  const onAddScoreHandler = async (key: string, value: string) => {
    if (!org?.currentOrg?.id) {
      setNotification("Error adding score", "error");
      return;
    }

    let numValue: number;
    if (value === "true") {
      numValue = 1;
    } else if (value === "false") {
      numValue = 0;
    } else {
      numValue = Number(value);
      if (isNaN(numValue)) {
        setNotification("Value must be a number or 'true'/'false'", "error");
        return;
      }
    }

    try {
      const res = await addRequestScore(
        request!.id,
        org.currentOrg.id,
        key,
        numValue
      );

      if (res?.status === 201) {
        setNotification("Score added", "success");
        setCurrentScores(
          currentScores
            ? { ...currentScores, [key]: numValue }
            : { [key]: numValue }
        );
      } else {
        setNotification("Error adding score", "error");
      }
    } catch (err) {
      console.error(err);
      setNotification(`Error adding score: ${err}`, "error");
    }
  };

  if (!request) {
    return <p>Loading...</p>;
  }

  return (
    <ScrollArea className="h-full">
      {/* Header */}
      <div className="w-full flex flex-col items-center sticky top-0 z-[1] border-b border-border">
        {/* First Row */}
        <div className="h-11 w-full flex flex-row justify-between items-center gap-2 px-3 border-b border-border bg-slate-50 dark:bg-slate-950">
          {/* Hide Drawer */}
          <Button
            variant={"none"}
            size={"square_icon"}
            className="w-fit"
            onClick={() => setOpenHandler(false)}
          >
            <LuPanelRightClose className="w-4 h-4" />
          </Button>

          {/* Badges */}
          <div className="flex flex-row items-center gap-2">
            {/* Duration Badge */}
            <div className="px-2 py-1 bg-slate-100 rounded-lg text-xs">
              {Number(request.heliconeMetadata.latency) / 1000}ms
            </div>
            {/* Cost Badge */}
            <div className="px-2 py-1 bg-slate-100 rounded-lg text-xs">
              ${formatNumber(request.heliconeMetadata.cost || 0)}
            </div>
            {/* Status Badge */}
            <StatusBadge
              statusType={request.heliconeMetadata.status.statusType}
              errorCode={request.heliconeMetadata.status.code}
            />
          </div>
        </div>

        <div className="w-full flex flex-col gap-2 bg-white dark:bg-black py-2.5">
          {/* Second Row */}
          <div className="w-full flex flex-row justify-between items-center gap-2 px-3">
            {/* Model Name */}
            <P className="font-medium text-secondary">{request.model}</P>

            {/* More Info */}
            <Button
              variant={"ghost"}
              size={"square_icon"}
              asPill
              onClick={() => setShowDetails(!showDetails)}
            >
              <LuEllipsis className="w-4 h-4" />
            </Button>
          </div>

          {/* Third Row */}
          {/* <div className="w-full flex flex-row items-center gap-4">
            <XSmall className="text-muted-foreground truncate max-w-48">
              {request.heliconeMetadata.user}
            </XSmall>

            <XSmall className="text-muted-foreground truncate max-w-48">
              {request.heliconeMetadata.path}
            </XSmall>

            <XSmall className="text-muted-foreground truncate max-w-48">
              {promptId || "No Prompt ID"}
            </XSmall>
          </div> */}

          {/* Properties Row */}
          <ScrollableRow
            items={
              currentProperties?.map((prop) => ({
                key: Object.keys(prop)[0],
                value: prop[Object.keys(prop)[0]],
              })) || []
            }
            onAdd={onAddPropertyHandler}
          />

          {/* Scores Row */}
          <ScrollableRow
            items={
              currentScores
                ? Object.entries(currentScores)
                    .filter(([key]) => key !== "helicone-score-feedback")
                    .map(([key, value]) => ({ key, value }))
                : []
            }
            onAdd={onAddScoreHandler}
            valueType="number"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        {/* Request Content */}
        <RenderMappedRequest
          mapperContent={request}
          promptData={promptDataQuery.data}
        />

        {/* Expandable Details Section */}
        {showDetails && (
          <div className="flex flex-col gap-6 p-4 border-t border-border">
            {/* Feedback Section */}
            <div className="flex flex-col gap-4">
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Feedback
              </div>
              <FeedbackButtons
                requestId={request.id}
                defaultValue={
                  request.heliconeMetadata.scores?.[
                    "helicone-score-feedback"
                  ] === 1
                }
              />
            </div>

            {/* Dataset Section */}
            <div className="flex flex-col gap-4">
              <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm items-center flex">
                Add to Dataset
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setNewDatasetModalOpen(true)}
                        className="ml-1.5 p-0.5 shadow-sm bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-md h-fit"
                      >
                        <PlusIcon className="h-3 w-3 text-gray-500" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Add to Dataset</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex flex-row items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (promptDataQuery.data?.id) {
                        router.push(`/prompts/${promptDataQuery.data?.id}`);
                      } else {
                        router.push(`/prompts/fromRequest/${request.id}`);
                      }
                    }}
                  >
                    <PiPlayBold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Test Prompt</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      jawn
                        .POST(
                          "/v2/experiment/create/from-request/{requestId}",
                          {
                            params: {
                              path: {
                                requestId: request.id,
                              },
                            },
                          }
                        )
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
                <TooltipContent>Create Experiment</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(request.schema || {}, null, 2)
                      );
                      setNotification("Copied to clipboard", "success");
                    }}
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy Request</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      <ThemedModal open={newDatasetModalOpen} setOpen={setNewDatasetModalOpen}>
        <NewDataset
          request_ids={[request.id]}
          onComplete={() => setNewDatasetModalOpen(false)}
        />
      </ThemedModal>
    </ScrollArea>
  );
};

export default RequestDiv;
