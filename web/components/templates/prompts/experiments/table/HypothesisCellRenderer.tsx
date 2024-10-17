import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@heroicons/react/24/outline";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PromptPlayground from "../../id/promptPlayground";
import { ScrollArea } from "../../../../ui/scroll-area";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import clsx from "clsx";

export const HypothesisCellRenderer: React.FC<any> = (params) => {
  const { data, colDef, context, hypothesisId, wrapText } = params;
  const promptVersionTemplate = context.promptVersionTemplateRef.current;

  const [showPromptPlayground, setShowPromptPlayground] = useState(false);

  // Parse the response data
  const responseString = data[hypothesisId];
  let parsedResponseData: any = {};

  try {
    parsedResponseData = JSON.parse(responseString);
  } catch (error) {
    console.error("Failed to parse response data:", error);
  }

  // Extract the content to display in the cell
  const content =
    parsedResponseData?.body?.choices?.[0]?.message?.content || "";

  // Check if content is longer than 100 characters
  const isContentLong = content.length > 100;

  // Extract the model and messages from the promptVersionTemplate
  const initialModel = promptVersionTemplate?.model || "";

  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPromptPlayground(true);
  };

  const formatPromptForPlayground = (): any => {
    return {
      model: initialModel,
      messages: [
        {
          role: "assistant",
          content: content,
        },
      ],
    };
  };

  if (data.isLoading?.[hypothesisId]) {
    return (
      <div className="w-full h-full whitespace-pre-wrap flex flex-row items-center space-x-2 pl-4">
        <span className="animate-ping inline-flex rounded-full bg-green-700 h-2 w-2"></span>
        <div className="italic">Generating...</div>
      </div>
    );
  }

  if (content) {
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
                {content}
              </div>
            </div>
          </DialogTrigger>
          <DialogContent
            className="w-[800px] p-0 [&>button]:hidden "
            showOverlay={false}
          >
            <ScrollArea className="flex flex-col overflow-y-auto max-h-[50vh] w-[800px]">
              <PromptPlayground
                prompt={formatPromptForPlayground()}
                selectedInput={data}
                onSubmit={(history, model) => {
                  setShowPromptPlayground(false);
                }}
                submitText="Save"
                initialModel={initialModel}
                isPromptCreatedFromUi={false}
                defaultEditMode={false}
                editMode={false}
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
                {content}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
            <ScrollArea className="flex flex-col overflow-y-auto max-h-[50vh]">
              <PromptPlayground
                prompt={formatPromptForPlayground()}
                selectedInput={data}
                onSubmit={(history, model) => {
                  setShowPromptPlayground(false);
                }}
                submitText="Save"
                initialModel={initialModel}
                isPromptCreatedFromUi={false}
                defaultEditMode={false}
                editMode={false}
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
          onClick={(e) => {
            e.stopPropagation();
            params.handleRunHypothesis(hypothesisId, [data.dataset_row_id]);
          }}
        >
          <PlayIcon className="w-4 h-4" />
        </Button>
      </div>
    );
  }
};

export const OriginalMessagesCellRenderer: React.FC<any> = (params) => {
  const { data, colDef, context, prompt, wrapText } = params;
  const hypothesisId = colDef.field;

  const [showPromptPlayground, setShowPromptPlayground] = useState(false);
  const content = data[hypothesisId];
  const parsedData = data.messages;
  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPromptPlayground(true);
  };

  const formatPromptForPlayground = (): any => {
    return {
      model: prompt?.model || "",
      messages: JSON.parse(parsedData || "[]"),
    };
  };

  return (
    <Popover open={showPromptPlayground} onOpenChange={setShowPromptPlayground}>
      <PopoverTrigger asChild>
        <div
          className={`w-full h-full items-center flex ${
            content ? "justify-start" : "justify-end"
          }`}
          onClick={handleCellClick}
        >
          {content && content !== "{}" ? (
            <div className={clsx(wrapText && "whitespace-pre-wrap")}>
              {content}
            </div>
          ) : (
            <div>
              {/* <Button
                variant="ghost"
                className="w-6 h-6 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500"
                onClick={(e) => {
                  e.stopPropagation();
                  params.handleRunHypothesis(hypothesisId, [
                    data.dataset_row_id,
                  ]);
                }}
              >
                <PlayIcon className="w-4 h-4" />
              </Button> */}
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
        <ScrollArea className="flex flex-col overflow-y-auto max-h-[50vh]">
          <PromptPlayground
            prompt={formatPromptForPlayground() || ""}
            selectedInput={data}
            onSubmit={(history, model) => {
              setShowPromptPlayground(false);
            }}
            submitText="Save"
            initialModel={prompt?.model || ""}
            isPromptCreatedFromUi={false}
            defaultEditMode={false}
            editMode={false}
            chatType="request"
          />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
export const OriginalOutputCellRenderer: React.FC<any> = (params) => {
  const { data, colDef, context, prompt, wrapText } = params;
  const hypothesisId = colDef.field;
  const inputKeys = context.inputKeys;
  const [showPromptPlayground, setShowPromptPlayground] = useState(false);
  const content = data[hypothesisId];
  const parsedData = data.messages;
  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPromptPlayground(true);
  };

  const formatPromptForPlayground = (): any => {
    return {
      model: prompt?.model || "",
      messages: [
        {
          role: "assistant",
          content: content,
        },
      ],
    };
  };

  if (data.isLoading?.[hypothesisId] && !content) {
    return (
      <div className="w-full h-full whitespace-pre-wrap flex flex-row items-center space-x-2 pl-4">
        <span className="animate-ping inline-flex rounded-full bg-green-700 h-2 w-2"></span>
        <div className="italic">Generating...</div>
      </div>
    );
  }

  return (
    <Popover open={showPromptPlayground} onOpenChange={setShowPromptPlayground}>
      <PopoverTrigger asChild>
        <div
          className={`w-full h-full items-center flex ${
            content ? "justify-start" : "justify-end"
          }`}
          onClick={handleCellClick}
        >
          {content ? (
            <div className={clsx(wrapText && "whitespace-pre-wrap")}>
              {content}
            </div>
          ) : (
            <div>
              <Button
                variant="ghost"
                className="w-6 h-6 p-0 border-slate-200 border rounded-md bg-slate-50 text-slate-500"
                onClick={(e) => {
                  e.stopPropagation();
                  params.handleRunHypothesis("original", [data.dataset_row_id]);
                }}
              >
                <PlayIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
        <ScrollArea className="flex flex-col overflow-y-auto max-h-[50vh]">
          <PromptPlayground
            prompt={formatPromptForPlayground() || ""}
            selectedInput={data}
            onSubmit={(history, model) => {
              setShowPromptPlayground(false);
            }}
            submitText="Save"
            initialModel={prompt?.model || ""}
            isPromptCreatedFromUi={false}
            defaultEditMode={false}
            editMode={false}
            chatType="response"
          />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
