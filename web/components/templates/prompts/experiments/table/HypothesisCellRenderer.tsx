import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@heroicons/react/24/outline";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PromptPlayground from "../../id/promptPlayground";

export const HypothesisCellRenderer: React.FC<any> = (params) => {
  const { data, colDef, context } = params;
  const promptVersionTemplate = context.promptVersionTemplateRef.current;
  const hypothesisId = colDef.field;

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
      <div className="w-full h-full flex items-center space-x-0.5 pl-0.5">
        <span className="animate-ping inline-flex rounded-full bg-green-700 h-1 w-1"></span>
        <div className="italic text-[0.4rem] text-gray-600">Running.</div>
      </div>
    );
  }

  if (content) {
    return (
      <Popover
        open={showPromptPlayground}
        onOpenChange={setShowPromptPlayground}
      >
        <PopoverTrigger asChild>
          <div
            className={`w-full h-full items-center flex justify-start`}
            onClick={handleCellClick}
          >
            <div>{content}</div>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
          <PromptPlayground
            prompt={formatPromptForPlayground()}
            selectedInput={data}
            onSubmit={(history, model) => {
              setShowPromptPlayground(false);
            }}
            submitText="Save"
            initialModel={initialModel}
            isPromptCreatedFromUi={true}
            defaultEditMode={false}
            editMode={false}
            chatType="response"
          />
        </PopoverContent>
      </Popover>
    );
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
  const { data, colDef, context, prompt } = params;
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
      messages: JSON.parse(parsedData || "[]"),
    };
  };

  return (
    <Popover open={showPromptPlayground} onOpenChange={setShowPromptPlayground}>
      <PopoverTrigger asChild>
        <div
          className={`w-full h-full items-center flex text-[0.5rem] ${
            content ? "justify-start" : "justify-end"
          }`}
          onClick={handleCellClick}
        >
          {content && content !== "{}" ? (
            <div className="truncate">{content}</div>
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
        <PromptPlayground
          prompt={formatPromptForPlayground() || ""}
          selectedInput={data}
          onSubmit={(history, model) => {
            setShowPromptPlayground(false);
          }}
          submitText="Save"
          initialModel={prompt?.model || ""}
          isPromptCreatedFromUi={true}
          defaultEditMode={false}
          editMode={false}
          chatType="request"
        />
      </PopoverContent>
    </Popover>
  );
};

export const OriginalOutputCellRenderer: React.FC<any> = (params) => {
  const { data, colDef, context, prompt } = params;
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

  return (
    <Popover open={showPromptPlayground} onOpenChange={setShowPromptPlayground}>
      <PopoverTrigger asChild>
        <div
          className={`w-full h-full items-center flex text-[0.5rem] ${
            content ? "justify-start" : "justify-end"
          }`}
          onClick={handleCellClick}
        >
          {content ? (
            <div>{content}</div>
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
        <PromptPlayground
          prompt={formatPromptForPlayground() || ""}
          selectedInput={data}
          onSubmit={(history, model) => {
            setShowPromptPlayground(false);
          }}
          submitText="Save"
          initialModel={prompt?.model || ""}
          isPromptCreatedFromUi={true}
          defaultEditMode={false}
          editMode={false}
          chatType="response"
        />
      </PopoverContent>
    </Popover>
  );
};
