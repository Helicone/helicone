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
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import clsx from "clsx";
import PromptPlayground from "../../../id/promptPlayground";
import {
  useExperimentRequestData,
  useExperimentTable,
} from "../hooks/useExperimentTable";
import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "../../../../../../lib/clients/jawnHook";

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
    const [showPromptPlayground, setShowPromptPlayground] = useState(false);
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

    const { runHypothesis, wrapText } = useExperimentTable(experimentTableId);

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

    const handleCellClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowPromptPlayground(true);
    };

    useEffect(() => {
      if (
        requestsData?.responseBody?.response?.choices?.[0]?.message?.content
      ) {
        setContent(
          requestsData.responseBody.response.choices[0].message.content
        );
        setRunning(false);
      }
    }, [requestsData?.responseBody?.response?.choices]);

    useEffect(() => {
      if (content || (promptTemplate?.helicone_template as any)?.messages) {
        setPlaygroundPrompt({
          model: initialModel,
          messages: [
            ...((promptTemplate?.helicone_template as any)?.messages ?? []),
            {
              role: "assistant",
              content: content,
            },
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

    // Check if content is longer than 100 characters
    const isContentLong = content && content.length > 20000;

    if (running) {
      return (
        <div className="flex items-center gap-2 py-2 px-4">
          <div className="w-2 h-2 bg-yellow-700 rounded-full animate-pulse"></div>
          <div className="text-sm text-slate-700">Generating...</div>
        </div>
      );
    }

    if (isRequestsLoading) {
      return (
        <div className="flex items-center gap-2 py-2 px-4">
          <div className="w-2 h-2 bg-green-700 rounded-full animate-pulse"></div>
          <div className="text-sm text-slate-700">Loading...</div>
        </div>
      );
    }

    if (hypothesisRequestId && content) {
      if (isContentLong) {
        return (
          <Dialog
            open={showPromptPlayground}
            onOpenChange={setShowPromptPlayground}
          >
            <DialogTrigger asChild>
              <div className="group relative w-full h-full">
                <Button
                  variant="ghost"
                  className="absolute top-2 right-2 w-6 h-6 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleRunHypothesis(e)}
                >
                  <PlayIcon className="w-4 h-4" />
                </Button>
                <div
                  className="w-full h-full items-center flex justify-start cursor-pointer py-2 px-4 text-slate-700 dark:text-slate-300"
                  onClick={handleCellClick}
                >
                  <div
                    className={clsx(
                      wrapText.data
                        ? "whitespace-nowrap max-h-[100px] overflow-y-hidden line-clamp-4 truncate text-ellipsis"
                        : "break-words whitespace-normal"
                    )}
                  >
                    {content}
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent
              className="w-[800px] p-0 [&>button]:hidden "
              showOverlay={false}
            >
              <ScrollArea className="flex flex-col overflow-y-auto max-h-[50vh] w-[800px]">
                <PromptPlayground
                  prompt={playgroundPrompt}
                  selectedInput={undefined}
                  onSubmit={(history, model) => {
                    setShowPromptPlayground(false);
                  }}
                  submitText="Save"
                  initialModel={initialModel}
                  isPromptCreatedFromUi={false}
                  defaultEditMode={false}
                  editMode={false}
                  playgroundMode="experiment"
                  chatType="response"
                />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        );
      } else {
        return (
          <Popover
            open={showPromptPlayground}
            onOpenChange={setShowPromptPlayground}
            modal={true}
          >
            <PopoverTrigger asChild>
              <div className="group relative w-full h-full">
                <Button
                  variant="ghost"
                  className="absolute top-2 right-2 w-6 h-6 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleRunHypothesis(e)}
                >
                  <PlayIcon className="w-4 h-4" />
                </Button>
                <div
                  className="w-full h-full items-center flex justify-start cursor-pointer py-2 px-4 text-slate-700 dark:text-slate-300"
                  onClick={handleCellClick}
                >
                  <div
                    className={clsx(
                      wrapText.data
                        ? "whitespace-nowrap max-h-[100px] overflow-y-hidden line-clamp-4 truncate text-ellipsis"
                        : "break-words whitespace-normal"
                    )}
                  >
                    {content}
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-[800px] p-0"
              side="bottom"
              align="start"
            >
              <ScrollArea className="flex flex-col overflow-y-auto max-h-[50vh]">
                <PromptPlayground
                  prompt={playgroundPrompt}
                  selectedInput={undefined}
                  onSubmit={(history, model) => {
                    setShowPromptPlayground(false);
                  }}
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
      }
    } else {
      return (
        <div className="w-full h-full items-center flex justify-end">
          <Button
            variant="ghost"
            className="w-6 h-6 m-2 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500"
            onClick={handleRunHypothesis}
          >
            <PlayIcon className="w-4 h-4" />
          </Button>
        </div>
      );
    }
  }
);

HypothesisCellRenderer.displayName = "HypothesisCellRenderer";
