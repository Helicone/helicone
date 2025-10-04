import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@heroicons/react/24/outline";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import clsx from "clsx";
import PromptPlayground from "../../../id/promptPlayground";
import {
  useExperimentRequestData,
  useExperimentTable,
} from "../hooks/useExperimentTable";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useJawnClient } from "../../../../../../lib/clients/jawnHook";
import { TriangleAlertIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type HypothesisCellRef = {
  runHypothesis: () => Promise<void>;
};

export const HypothesisCellRenderer = forwardRef<
  HypothesisCellRef,
  {
    requestId?: string;
    prompt?: any;
    experimentTableId: string;
    inputRecordId: string;
    promptVersionId: string;
  }
>(
  (
    { requestId, prompt, experimentTableId, inputRecordId, promptVersionId },
    ref,
  ) => {
    const [running, setRunning] = useState(false);
    const initialModel = prompt?.model || "";
    const [hypothesisRequestId, setHypothesisRequestId] = useState<
      string | null
    >(requestId ?? "");
    const [content, setContent] = useState<string | null>(null);
    const [playgroundPrompt, setPlaygroundPrompt] = useState<any>(null);

    const { requestsData, isRequestsLoading } = useExperimentRequestData(
      hypothesisRequestId ?? "",
    );
    const jawnClient = useJawnClient();

    useEffect(() => {
      setHypothesisRequestId(requestId ?? "");
    }, [requestId]);

    const { runHypothesis, wrapText, selectedScoreKey } =
      useExperimentTable(experimentTableId);

    const { data: promptTemplate } = useQuery({
      queryKey: ["promptTemplate", promptVersionId],
      queryFn: async () => {
        if (!promptVersionId) return null;

        const res = await jawnClient.GET(
          "/v1/prompt/version/{promptVersionId}",
          {
            params: {
              path: {
                promptVersionId: promptVersionId,
              },
            },
          },
        );

        const parentPromptVersion = await jawnClient.GET(
          "/v1/prompt/version/{promptVersionId}",
          {
            params: {
              path: {
                promptVersionId: res.data?.data?.parent_prompt_version ?? "",
              },
            },
          },
        );

        return {
          ...res.data?.data,
          parent_prompt_version: parentPromptVersion?.data?.data,
        };
      },
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    });

    const queryClient = useQueryClient();

    const { data: score } = useQuery({
      queryKey: [
        "experimentScore",
        experimentTableId,
        hypothesisRequestId,
        selectedScoreKey,
      ],
      queryFn: async () => {
        if (!hypothesisRequestId || !selectedScoreKey) return null;

        const res = await jawnClient.GET(
          "/v2/experiment/{experimentId}/{requestId}/{scoreKey}",
          {
            params: {
              path: {
                experimentId: experimentTableId,
                requestId: hypothesisRequestId,
                scoreKey: selectedScoreKey,
              },
            },
          },
        );

        const promptVersionIdScores = queryClient.getQueryData<{
          data: Record<string, { value: any; max: number; min: number }>;
        }>(["experimentScores", experimentTableId, promptVersionId]);

        return {
          cellValue: res.data?.data,
          max: promptVersionIdScores?.data?.[selectedScoreKey]?.max,
          min: promptVersionIdScores?.data?.[selectedScoreKey]?.min,
          avg: promptVersionIdScores?.data?.[selectedScoreKey]?.value,
        };
      },
      enabled: !!hypothesisRequestId && !!selectedScoreKey,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    });

    useEffect(() => {
      if (
        requestsData?.responseBody?.response?.choices?.[0]?.message?.content
      ) {
        setContent(
          requestsData.responseBody.response.choices[0].message.content,
        );
        setRunning(false);
      } else if (
        // if the initial model is claude
        requestsData?.responseBody?.response?.content &&
        requestsData?.responseBody?.response?.content?.length > 0
      ) {
        setContent(requestsData.responseBody.response.content[0].text);
        setRunning(false);
      }
    }, [
      requestsData?.responseBody?.response?.choices,
      requestsData?.responseBody?.response?.content,
    ]);

    useEffect(() => {
      if (content || (promptTemplate?.helicone_template as any)?.messages) {
        setPlaygroundPrompt({
          model: initialModel,
          messages: [
            ...((promptTemplate?.helicone_template as any)?.messages ?? []),
            content
              ? {
                  role: "assistant",
                  content: content,
                }
              : null,
          ],
        });
      }
    }, [content, promptTemplate?.helicone_template, initialModel]);

    const handleRunHypothesis = async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setRunning(true);
      const res = await runHypothesis.mutateAsync({
        promptVersionId,
        inputRecordId,
      });

      if (res) {
        setHypothesisRequestId(res);
      }
      setRunning(false);
    };

    const handleRunHypothesisIfRequired = async (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!content) {
        await handleRunHypothesis(e);
      }
    };

    useImperativeHandle(ref, () => ({
      runHypothesis: () => handleRunHypothesis(),
      runHypothesisIfRequired: () => handleRunHypothesisIfRequired(),
    }));

    if (running) {
      return (
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-700"></div>
          <div className="text-sm text-slate-700 dark:text-slate-400">
            Generating...
          </div>
        </div>
      );
    }

    if (isRequestsLoading) {
      return (
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-700"></div>
          <div className="text-sm text-slate-700 dark:text-slate-400">
            Loading...
          </div>
        </div>
      );
    }

    if (hypothesisRequestId && content) {
      return (
        <Popover modal={true}>
          <PopoverTrigger asChild>
            <div className="group relative flex h-full w-full flex-col">
              <Button
                variant="outline"
                className="absolute right-2 top-2 z-[1] h-[22px] w-[22px] rounded-md border border-slate-200 p-0 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100 dark:border-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRunHypothesis(e);
                }}
              >
                <PlayIcon className="h-4 w-4" />
              </Button>
              <div className="flex h-full w-full cursor-pointer flex-col justify-start px-4 py-2 text-slate-700 dark:text-slate-300">
                {selectedScoreKey && score && (
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className={clsx(
                        "h-2.5 w-2.5 rounded-sm",
                        score.cellValue?.value &&
                          score.cellValue?.value > score.avg
                          ? "bg-green-500"
                          : "bg-red-500",
                      )}
                    ></div>
                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                      {selectedScoreKey.replace("-hcone-bool", "")}:{" "}
                      {score.cellValue?.value}
                    </p>
                  </div>
                )}
                <div
                  className={clsx(
                    "whitespace-normal break-words",
                    wrapText.data &&
                      "line-clamp-4 max-h-[100px] overflow-y-hidden truncate text-ellipsis",
                  )}
                >
                  {content}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 z-[20] text-xs text-slate-500">
                {new Date(promptTemplate?.updated_at ?? "").getTime() >
                  new Date(
                    requestsData?.request_created_at ?? "",
                  ).getTime() && (
                  <Tooltip>
                    <TooltipTrigger>
                      <TriangleAlertIcon className="h-4 w-4 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="rounded-none border-0 bg-yellow-50 px-1 py-px text-[11px] text-yellow-500 shadow-none dark:bg-yellow-950 dark:text-yellow-500"
                    >
                      Prompt has changed since this cell was last run
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[800px] overflow-y-auto p-0"
            style={{
              maxHeight: "var(--radix-popover-content-available-height)",
            }}
            alignOffset={10}
            side="bottom"
            align="start"
          >
            <ScrollArea className="flex max-h-[50vh] flex-col overflow-y-auto">
              <PromptPlayground
                prompt={playgroundPrompt}
                selectedInput={undefined}
                submitText="Save"
                initialModel={initialModel}
                isPromptCreatedFromUi={false}
                defaultEditMode={false}
                editMode={false}
                playgroundMode="experiment"
                chatType="response"
              />
            </ScrollArea>
          </PopoverContent>
        </Popover>
      );
    } else {
      return (
        <Button
          variant="ghost"
          className="absolute right-2 top-2 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-0 text-slate-500 dark:border-slate-800 dark:bg-transparent"
          onClick={handleRunHypothesis}
        >
          <PlayIcon className="h-4 w-4" />
        </Button>
      );
    }
  },
);

HypothesisCellRenderer.displayName = "HypothesisCellRenderer";
