import { getUSDateFromString } from "@/components/shared/utils/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import {
  ArrowPathIcon,
  EllipsisHorizontalIcon,
  MinusIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addRequestLabel,
  addRequestScore,
} from "../../../services/lib/requests";
import { useOrg } from "../../layout/org/organizationContext";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { formatNumber } from "../../shared/utils/formatNumber";
import NewDataset from "../datasets/NewDataset";
import FeedbackButtons from "../feedback/thumbsUpThumbsDown";
import ModelPill from "./modelPill";
import { RenderMappedRequest } from "./RenderHeliconeRequest";
import StatusBadge from "./statusBadge";

function getPathName(url: string) {
  try {
    return new URL(url).pathname;
  } catch (e) {
    return url;
  }
}

interface RequestRowProps {
  request: MappedLLMRequest;
  properties: string[];
  open?: boolean;
  wFull?: boolean;
  displayPreview?: boolean;
  promptData?: any;
}

const RequestRow = (props: RequestRowProps) => {
  const {
    request,
    properties,
    open = true,
    wFull = false,
    displayPreview = true,
    promptData,
  } = props;

  const org = useOrg();

  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isScoresAddingLabel, setIsScoresAddingLabel] = useState(false);
  const [isScoresAdding, setIsScoresAdding] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentProperties, setCurrentProperties] = useState<
    {
      [key: string]: string;
    }[]
  >();

  const [currentScores, setCurrentScores] = useState<Record<string, number>>();

  const { setNotification } = useNotification();

  const promptId = useMemo(() => {
    return request.heliconeMetadata.customProperties?.["Helicone-Prompt-Id"] as
      | string
      | undefined;
  }, [request.heliconeMetadata.customProperties]);

  const sessionData = useMemo(() => {
    const sessionId = request.heliconeMetadata.customProperties?.[
      "Helicone-Session-Id"
    ] as string | undefined;
    return { sessionId };
  }, [request.heliconeMetadata.customProperties]);

  const experimentId = useMemo(() => {
    return request.heliconeMetadata.customProperties?.[
      "Helicone-Experiment-Id"
    ] as string | undefined;
  }, [request.heliconeMetadata.customProperties]);

  useEffect(() => {
    // find all the key values of properties and set them to currentProperties
    const currentProperties: {
      [key: string]: string;
    }[] = [];

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
  }, [
    properties,
    request.heliconeMetadata.customProperties,
    request.heliconeMetadata.scores,
  ]);

  const onAddLabelHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(true);

    const formData = new FormData(e.currentTarget);
    const key = formData.get("key") as string;
    const value = formData.get("value") as string;

    if (!key || !value || org?.currentOrg?.id === undefined) {
      setNotification("Error adding label", "error");
      setIsAdding(false);
      return;
    }
    try {
      const res = await addRequestLabel(
        request.id,
        org?.currentOrg?.id,
        key,
        value
      );

      if (res?.status === 200) {
        setNotification("Label added", "success");
        setCurrentProperties(
          currentProperties
            ? [
              ...currentProperties,
              {
                [key]: value,
              },
            ]
            : [{ [key]: value }]
        );

        setIsAdding(false);
      } else {
        setNotification("Error adding label", "error");
        setIsAdding(false);
      }
    } catch (err) {
      console.error(err);
      setNotification(`Error adding label: ${err}`, "error");
      setIsAdding(false);
      return;
    }
  };

  const onAddScoreHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsScoresAdding(true);

    const formData = new FormData(e.currentTarget);
    const key = formData.get("key") as string;
    let value = formData.get("value") as any;
    let valueType = "number";

    if (!isNaN(Number(value))) {
      value = Number(value);
    } else if (value === "true") {
      value = true;
      valueType = "boolean";
    } else if (value === "false") {
      value = false;
      valueType = "boolean";
    } else {
      setNotification("Value must be a number or 'true'/'false'", "error");
      setIsScoresAdding(false);
      return;
    }

    if (currentScores && currentScores[key]) {
      setNotification("Score already exists", "error");
      setIsScoresAdding(false);
      return;
    }

    if (!key || org?.currentOrg?.id === undefined) {
      setNotification("Error adding score", "error");
      setIsScoresAdding(false);
      return;
    }
    try {
      const res = await addRequestScore(
        request.id,
        org?.currentOrg?.id,
        key,
        value
      );

      if (res?.status === 201) {
        setNotification("Score added", "success");
        setCurrentScores(
          currentScores
            ? {
              ...currentScores,
              [key]: value,
            }
            : {
              [key]: value,
            }
        );

        setIsScoresAdding(false);
      } else {
        setNotification("Error adding score", "error");
        setIsScoresAdding(false);
      }
    } catch (err) {
      console.error(err);
      setNotification(`Error adding score: ${err}`, "error");
      setIsScoresAdding(false);
      return;
    }
  };

  const [newDatasetModalOpen, setNewDatasetModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full sentry-mask-me">

      <div className="flex flex-col w-full gap-1">

        {/* Header with model name */}
        <div className="flex items-center justify-between px-2">
          <h2 className="text-base font-medium leading-normal text-sidebar-foreground">
            {request.model}
          </h2>
          <Button variant="ghost" size="sm">
            <EllipsisHorizontalIcon className="h-4 w-4" />
          </Button>
          {/* {request.heliconeMetadata.user && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {request.heliconeMetadata.user}
            </span>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getPathName(request.heliconeMetadata.path)}
          </span> */}
        </div>

        {/* Quick Actions: User, Prompt, Sessions */}
        <div className="flex items-center justify-start gap-2">
          {request.heliconeMetadata.user && (
            <Button variant="ghost" size="xs" className="px-2 py-1">
              <span className="text-xs font-normal leading-none text-base-foreground truncate">
                {request.heliconeMetadata.user}
              </span>
            </Button>
          )}
          {request.heliconeMetadata.customProperties?.["Helicone-Prompt-Id"] && (
            <Button variant="ghost" size="xs" className="px-2 py-1">
              <span className="text-xs font-normal leading-none text-base-foreground truncate">
                {request.heliconeMetadata.customProperties?.[
                  "Helicone-Prompt-Id"
                ] as string}
              </span>
            </Button>
          )}
          {request.heliconeMetadata.customProperties?.["Helicone-Session-Id"] && (
            <Button variant="ghost" size="xs" className="px-2 py-1">
              <span className="text-xs font-normal leading-none text-base-foreground truncate">
                {request.heliconeMetadata.customProperties?.[
                  "Helicone-Session-Id"
                ] as string}
              </span>
            </Button>
          )}
        </div>

        {/* Main grid layout for request details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 w-full pt-2 px-2">

          {/* Metrics grid */}
          <div className="flex justify-between items-center">
            <div className="text-xs font-normal text-sidebar-foreground">Total Tokens</div>
            <div className="text-xs font-medium text-secondary-foreground">
              {request.heliconeMetadata.totalTokens !== null && request.heliconeMetadata.totalTokens !== undefined
                ? request.heliconeMetadata.totalTokens
                : "N/A"}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs font-normal text-sidebar-foreground">Prompt Tokens</div>
            <div className="text-xs font-medium text-secondary-foreground">
              {request.heliconeMetadata.promptTokens !== null && request.heliconeMetadata.promptTokens !== undefined
                ? request.heliconeMetadata.promptTokens
                : "N/A"}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs font-normal text-sidebar-foreground">Completion Tokens</div>
            <div className="text-xs font-medium text-secondary-foreground">
              {request.heliconeMetadata.completionTokens !== null && request.heliconeMetadata.completionTokens !== undefined
                ? request.heliconeMetadata.completionTokens
                : "N/A"}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs font-normal text-sidebar-foreground">Time to First Token</div>
            <div className="text-xs font-medium text-secondary-foreground">
              {request.heliconeMetadata.timeToFirstToken !== null && request.heliconeMetadata.timeToFirstToken !== undefined
                ? `${request.heliconeMetadata.timeToFirstToken}ms`
                : "N/A"}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs font-normal text-sidebar-foreground">Cache Tokens</div>
            <div className="text-xs font-medium text-secondary-foreground">
              {0}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs font-normal text-sidebar-foreground">Created</div>
            <div className="text-xs font-medium text-secondary-foreground">
              {request.heliconeMetadata.createdAt ? new Date(request.heliconeMetadata.createdAt).toLocaleString() : "N/A"}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs font-normal text-sidebar-foreground">Provider</div>
            <div className="text-xs font-medium text-secondary-foreground">
              {request.heliconeMetadata.provider || "OpenAI"}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs font-normal text-sidebar-foreground">Path</div>
            <div className="text-xs font-medium text-secondary-foreground">
              {getPathName(request.heliconeMetadata.path)}
            </div>
          </div>
        </div>

        {/* Request ID with same styling as grid items but full width */}
        <div className="w-full max-w-full py-2 px-2 pb-4">
          <div className="flex justify-between items-center">
            <div className="text-xs font-normal text-sidebar-foreground">Request ID</div>
            <div className="text-xs font-medium text-secondary-foreground">
              {request.id}
            </div>
          </div>
        </div>
      </div>

      {/* Properties section */}
      <div className="flex flex-col w-full border-t border-border">
        <div className="flex items-start justify-between p-2 w-full">
          <div className="text-xs font-semibold text-sidebar-foreground w-[100px] py-1">Properties</div>

          <div className="flex flex-1 flex-wrap gap-2 items-start">
            {currentProperties && currentProperties.length > 0 &&
              currentProperties
                .filter(property =>
                  !["Helicone-Prompt-Id", "Helicone-Session-Id", "Helicone-Experiment-Id"].includes(Object.keys(property)[0])
                )
                .map((property, i) => {
                  const key = Object.keys(property)[0];
                  return (
                    <Link
                      key={i}
                      href={`/properties?property=${encodeURIComponent(key)}`}
                      passHref
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-auto px-2 py-1 text-xs font-medium"
                      >
                        <span className="font-medium text-muted-foreground mr-1">{key}</span>
                        <span className="text-secondary-foreground">{property[key]}</span>
                      </Button>
                    </Link>
                  );
                })
            }

            {isAddingLabel && (
              <form
                onSubmit={onAddLabelHandler}
                className="flex items-start gap-2 h-7"
              >
                <div className="flex gap-1 bg-secondary rounded-md p-1">
                  <Input
                    type="text"
                    name="key"
                    id="key"
                    required
                    autoFocus
                    className="h-5 w-20 text-xs px-1 py-0 rounded-sm"
                    placeholder="Key"
                  />
                  <Input
                    type="text"
                    name="value"
                    id="value"
                    required
                    className="h-5 w-20 text-xs px-1 py-0 rounded-sm"
                    placeholder="Value"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                  >
                    {isAdding ? (
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => setIsAddingLabel(false)}
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </Button>
                </div>
              </form>
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 w-7 p-0 ml-2 flex-shrink-0"
                  onClick={() => {
                    setIsAddingLabel(!isAddingLabel);
                  }}
                >
                  {isAddingLabel ? (
                    <MinusIcon className="h-3 w-3" />
                  ) : (
                    <PlusIcon className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a property</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Scores section */}
      <div className="flex flex-col w-full border-t border-border">
        <div className="flex items-start justify-between p-2 w-full">
          <div className="text-xs font-semibold text-sidebar-foreground w-[100px]">Scores</div>

          <div className="flex flex-1 flex-wrap gap-2 items-start">
            {currentScores && Object.keys(currentScores).length > 0 &&
              Object.entries(currentScores)
                .filter(([key]) => key !== "helicone-score-feedback")
                .map(([key, value]) => (
                  <Button
                    key={key}
                    variant="secondary"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs font-medium"
                  >
                    <span className="font-medium text-muted-foreground mr-1">
                      {key.replace("-hcone-bool", "")}
                    </span>
                    <span className="text-secondary-foreground">
                      {key.endsWith("-hcone-bool")
                        ? value === 1
                          ? "true"
                          : "false"
                        : Number(value)}
                    </span>
                  </Button>
                ))
            }

            {isScoresAddingLabel && (
              <form
                onSubmit={onAddScoreHandler}
                className="flex items-start gap-2 h-7"
              >
                <div className="flex gap-1 bg-secondary rounded-md p-1">
                  <Input
                    type="text"
                    name="key"
                    id="key"
                    required
                    autoFocus
                    className="h-5 w-20 text-xs px-1 py-0 rounded-sm"
                    placeholder="Key"
                  />
                  <Input
                    type="text"
                    name="value"
                    id="value"
                    required
                    className="h-5 w-20 text-xs px-1 py-0 rounded-sm"
                    placeholder="Value"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                  >
                    {isAdding ? (
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => setIsScoresAddingLabel(false)}
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </Button>
                </div>
              </form>
            )}
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 w-7 p-0 ml-2 flex-shrink-0"
                  onClick={() => {
                    setIsScoresAddingLabel(!isScoresAddingLabel);
                  }}
                >
                  {isScoresAddingLabel ? (
                    <MinusIcon className="h-3 w-3" />
                  ) : (
                    <PlusIcon className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a score</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex flex-col py-2 px-2 border-t border-border bg-red-200">

        {/* Request/Response content */}
        {
          displayPreview && (
            <div className="flex flex-col space-y-8 pt-4 border-t border-gray-200 dark:border-gray-800">
              <RenderMappedRequest
                mapperContent={request}
                promptData={promptData}
              />
            </div>
          )
        }

        <div className="min-h-[100px]">{/* space */}</div>
        <ThemedModal open={newDatasetModalOpen} setOpen={setNewDatasetModalOpen}>
          <NewDataset
            request_ids={[request.id]}
            onComplete={() => setNewDatasetModalOpen(false)}
          />
        </ThemedModal>
      </div >
    </div>
  );
};

export default RequestRow;
