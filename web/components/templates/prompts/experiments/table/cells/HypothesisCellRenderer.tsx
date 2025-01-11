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
    ref
  ) => {
    const [running, setRunning] = useState(false);
    const initialModel = prompt?.model || "";
    const [hypothesisRequestId, setHypothesisRequestId] = useState<
      string | null
    >(requestId ?? "");
    const [content, setContent] = useState<string | null>(null);
    const [playgroundPrompt, setPlaygroundPrompt] = useState<any>(null);

    const { requestsData, isRequestsLoading } = useExperimentRequestData(
      hypothesisRequestId ?? ""
    );
    const jawnClient = useJawnClient();

    useEffect(() => {
      setHypothesisRequestId(requestId ?? "");
    }, [requestId]);

    const { runHypothesis, wrapText, selectedScoreKey } =
      useExperimentTable(experimentTableId);

    const { data: promptTemplate } = useQuery(
      ["promptTemplate", promptVersionId],
      async () => {
        if (!promptVersionId) return null;

        const res = await jawnClient.GET(
          "/v1/prompt/version/{promptVersionId}",
          {
            params: {
              path: {
                promptVersionId: promptVersionId,
              },
            },
          }
        );

        const parentPromptVersion = await jawnClient.GET(
          "/v1/prompt/version/{promptVersionId}",
          {
            params: {
              path: {
                promptVersionId: res.data?.data?.parent_prompt_version ?? "",
              },
            },
          }
        );

        return {
          ...res.data?.data,
          parent_prompt_version: parentPromptVersion?.data?.data,
        };
      },
      {
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
      }
    );

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
          }
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

    const handleCellClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    useEffect(() => {
      if (
        requestsData?.responseBody?.response?.choices?.[0]?.message?.content
      ) {
        setContent(
          requestsData.responseBody.response.choices[0].message.content
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

    useImperativeHandle(ref, () => ({
      runHypothesis: () => handleRunHypothesis(),
    }));

    if (running) {
      return (
        <div className="flex items-center gap-2 py-2 px-4">
          <div className="w-2 h-2 bg-yellow-700 rounded-full animate-pulse"></div>
          <div className="text-sm text-slate-700 dark:text-slate-400">
            Generating...
          </div>
        </div>
      );
    }

    if (isRequestsLoading) {
      return (
        <div className="flex items-center gap-2 py-2 px-4">
          <div className="w-2 h-2 bg-green-700 rounded-full animate-pulse"></div>
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
            <div className="group relative w-full h-full flex flex-col">
              <Button
                variant="outline"
                className="absolute top-2 right-2 w-6 h-6 p-0 border-slate-200 dark:border-slate-800 border rounded-md text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity z-[1] "
                onClick={(e) => {
                  e.stopPropagation();
                  handleRunHypothesis(e);
                }}
              >
                <PlayIcon className="w-4 h-4" />
              </Button>
              <div className="w-full h-full flex flex-col justify-start cursor-pointer py-2 px-4 text-slate-700 dark:text-slate-300">
                {selectedScoreKey && score && (
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={clsx(
                        "h-2.5 w-2.5 rounded-sm",
                        score.cellValue?.value &&
                          score.cellValue?.value > score.avg
                          ? "bg-green-500"
                          : "bg-red-500"
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
                    "break-words whitespace-normal",
                    wrapText.data &&
                      "max-h-[100px] overflow-y-hidden line-clamp-4 truncate text-ellipsis"
                  )}
                >
                  {content}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-slate-500 z-[20]">
                {new Date(promptTemplate?.updated_at ?? "").getTime() >
                  new Date(
                    requestsData?.request_created_at ?? ""
                  ).getTime() && (
                  <Tooltip>
                    <TooltipTrigger>
                      <TriangleAlertIcon className="w-4 h-4 text-yellow-500" />
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="text-[11px] py-px px-1 border-0 text-yellow-500 dark:text-yellow-500 shadow-none rounded-none bg-yellow-50 dark:bg-yellow-950"
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
            <ScrollArea className="flex flex-col overflow-y-auto max-h-[50vh]">
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
          className="w-6 h-6 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500 absolute top-2 right-2"
          onClick={handleRunHypothesis}
        >
          <PlayIcon className="w-4 h-4" />
        </Button>
      );
    }
  }
);

HypothesisCellRenderer.displayName = "HypothesisCellRenderer";
