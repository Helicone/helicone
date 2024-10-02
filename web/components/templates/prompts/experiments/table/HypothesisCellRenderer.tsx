import React, { useState, useEffect } from "react";
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
  const hypothesisId = colDef.field;
  const inputKeys = context.inputKeys;
  const [showPromptPlayground, setShowPromptPlayground] = useState(false);
  // Add state for loading status
  const [loadingStatus, setLoadingStatus] = useState<
    "queued" | "running" | null
  >(null);

  // Get the input keys from context
  const inputsAreEmpty = inputKeys?.every((key: string) => !data[key]);

  if (inputsAreEmpty) {
    // If inputs are empty, render an empty cell
    return <div></div>;
  }

  const responseData = data[hypothesisId];
  const parsedResponseData = responseData ? JSON.parse(responseData) : null;

  const content =
    parsedResponseData?.body?.choices?.[0]?.message?.content || null;

  const formatPromptForPlayground = (): any => {
    if (!parsedResponseData?.body?.choices?.[0]?.message) return null;

    return {
      model: parsedResponseData.model || "",
      messages: [
        {
          role: parsedResponseData.body.choices[0].message.role || "assistant",
          content: [
            {
              text: parsedResponseData.body.choices[0].message.content || "",
              type: "text",
            },
          ],
        },
      ],
    };
  };

  const isLoading = data.isLoading?.[hypothesisId];

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      setLoadingStatus("queued");
      timer = setTimeout(() => {
        setLoadingStatus("running");
      }, Math.random() * 5000); // 3 seconds
    } else {
      setLoadingStatus(null);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading]);

  const handleCellClick = (e: React.MouseEvent) => {
    console.log("some", content);
    e.stopPropagation();
    setShowPromptPlayground(true);
  };

  if (isLoading) {
    if (loadingStatus === "queued") {
      return (
        <div className="w-full h-full whitespace-pre-wrap flex flex-row items-center space-x-2 pl-4">
          <span className="animate-ping inline-flex rounded-full bg-yellow-700 h-2 w-2"></span>
          <div className="italic ">Queued...</div>
        </div>
      );
    } else if (loadingStatus === "running") {
      return (
        <div className="w-full h-full whitespace-pre-wrap flex flex-row items-center space-x-2 pl-4">
          <span className="animate-ping inline-flex rounded-full bg-green-700 h-2 w-2"></span>
          <div className="italic">Running...</div>
        </div>
      );
    }
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
            <div>{content}</div>
          ) : (
            <div>
              <Button
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
              </Button>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
        <PromptPlayground
          prompt={formatPromptForPlayground() || ""}
          selectedInput={data}
          onSubmit={(history, model) => {
            console.log("Submitted:", history, model);
            setShowPromptPlayground(false);
          }}
          submitText="Save"
          initialModel={parsedResponseData?.model || ""}
          isPromptCreatedFromUi={true}
          defaultEditMode={false}
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
    console.log("some", parsedData);
    console.log("prompt", prompt);
    e.stopPropagation();
    setShowPromptPlayground(true);
  };

  const formatPromptForPlayground = (): any => {
    return {
      model: prompt?.model || "",
      messages: JSON.parse(parsedData),
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
          {content ? (
            <div>{content}</div>
          ) : (
            <div>
              <Button
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
              </Button>
            </div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
        <PromptPlayground
          prompt={formatPromptForPlayground() || ""}
          selectedInput={data}
          onSubmit={(history, model) => {
            console.log("Submitted:", history, model);
            setShowPromptPlayground(false);
          }}
          submitText="Save"
          initialModel={prompt?.model || ""}
          isPromptCreatedFromUi={true}
          defaultEditMode={false}
        />
      </PopoverContent>
    </Popover>
  );
};
