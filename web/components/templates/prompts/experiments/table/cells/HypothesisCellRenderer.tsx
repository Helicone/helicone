import React, { useEffect, useState } from "react";
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

export const HypothesisCellRenderer = ({
  wrapText,
  requestId,
  prompt,
  experimentTableId,
  inputRecordId,
  promptVersionId,
}: {
  wrapText: boolean;
  requestId?: string;
  prompt?: any;
  experimentTableId: string;
  inputRecordId: string;
  promptVersionId: string;
}) => {
  const [running, setRunning] = useState(false);
  const [showPromptPlayground, setShowPromptPlayground] = useState(false);
  const initialModel = prompt?.model || "";
  const [hypothesisRequestId, setHypothesisRequestId] = useState<string | null>(
    requestId ?? ""
  );
  const [content, setContent] = useState<string | null>(null);
  const [playgroundPrompt, setPlaygroundPrompt] = useState<any>(null);

  const { requestsData, isRequestsLoading } = useExperimentRequestData(
    hypothesisRequestId ?? ""
  );

  useEffect(() => {
    setHypothesisRequestId(requestId ?? "");
  }, [requestId]);

  const { runHypothesis } = useExperimentTable(experimentTableId);

  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPromptPlayground(true);
  };

  useEffect(() => {
    if (requestsData?.responseBody?.response?.choices?.[0]?.message?.content) {
      setContent(requestsData.responseBody.response.choices[0].message.content);
      setRunning(false);
    }
  }, [requestsData?.responseBody?.response?.choices]);

  useEffect(() => {
    if (content || prompt?.helicone_template?.messages) {
      setPlaygroundPrompt({
        model: initialModel,
        messages: [
          ...(prompt?.helicone_template?.messages ?? []),
          {
            role: "assistant",
            content: content,
          },
        ],
      });
    }
  }, [content, prompt?.helicone_template?.messages, initialModel]);

  const handleRunHypothesis = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Check if content is longer than 100 characters
  const isContentLong = content && content.length > 100;

  if (running) {
    return <div className="italic">Generating...</div>;
  }

  if (isRequestsLoading) {
    return <div className="italic">Loading...</div>;
  }

  if (hypothesisRequestId && content) {
    if (isContentLong) {
      // Show Dialog for content longer than 100 characters
      return (
        <Dialog
          open={showPromptPlayground}
          onOpenChange={setShowPromptPlayground}
        >
          <DialogTrigger asChild>
            <div
              className="w-full h-full items-center flex justify-start cursor-pointer"
              onClick={handleCellClick}
            >
              <div className={clsx(wrapText && "whitespace-pre-wrap")}>
                OH {content}
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
      // Show Popover for content with 100 characters or less
      return (
        <Popover
          open={showPromptPlayground}
          onOpenChange={setShowPromptPlayground}
          modal={true}
        >
          <PopoverTrigger asChild>
            <div
              className="w-full h-full items-center flex justify-start cursor-pointer"
              onClick={handleCellClick}
            >
              <div className={clsx(wrapText && "whitespace-pre-wrap")}>
                AAJHAKJHJAKHKJAHKAJHAKJH {content}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
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
          className="w-6 h-6 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500"
          onClick={handleRunHypothesis}
        >
          <PlayIcon className="w-4 h-4" />
        </Button>
      </div>
    );
  }
};
