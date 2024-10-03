import React, { useState, useEffect } from "react";
import { getJawnClient } from "@/lib/clients/jawn";
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
  const experimentId = context.experimentId;
  const inputKeys = context.inputKeys;
  const jawnClient = getJawnClient(context.orgId); // Use orgId if necessary

  const [runStatus, setRunStatus] = useState<
    "PENDING" | "RUNNING" | "COMPLETED" | null
  >(null);
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
  const promptTemplate = promptVersionTemplate?.template || "";

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

  // useEffect(() => {
  //   let intervalId: NodeJS.Timeout;

  //   const checkStatus = async () => {
  //     const res = await jawnClient.POST(
  //       "/v1/experiment/{experimentId}/run-status",
  //       {
  //         params: {
  //           path: {
  //             experimentId,
  //           },
  //         },
  //       }
  //     );

  //     const status = res.data?.data?.status || null;
  //     setRunStatus(status as "PENDING" | "RUNNING" | "COMPLETED" | null);

  //     if (status === "COMPLETED") {
  //       clearInterval(intervalId);
  //       // Call refetchExperiments to update the data
  //       if (context.refetchExperiments) {
  //         await context.refetchExperiments();
  //       }
  //     }
  //   };

  //   if (runStatus !== "COMPLETED" && data.isLoading?.[hypothesisId]) {
  //     intervalId = setInterval(checkStatus, 5000); // Poll every 5 seconds
  //   }

  //   return () => {
  //     if (intervalId) {
  //       clearInterval(intervalId);
  //     }
  //   };
  // }, [runStatus, data, hypothesisId, experimentId, context, jawnClient]);

  if (data.isLoading?.[hypothesisId]) {
    return (
      <div className="w-full h-full whitespace-pre-wrap flex flex-row items-center space-x-2 pl-4">
        <span className="animate-ping inline-flex rounded-full bg-green-700 h-2 w-2"></span>
        <div className="italic">Running...</div>
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
          prompt={formatPromptForPlayground()}
          selectedInput={data}
          onSubmit={(history, model) => {
            console.log("Submitted:", history, model);
            setShowPromptPlayground(false);
          }}
          submitText="Save"
          initialModel={initialModel}
          isPromptCreatedFromUi={true}
          defaultEditMode={false}
        />
      </PopoverContent>
    </Popover>
  );
};

export const OriginalMessagesCellRenderer: React.FC<any> = (params) => {
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
export const OriginalOutputCellRenderer: React.FC<any> = (params) => {
  const { data, colDef, context, prompt } = params;
  const hypothesisId = colDef.field;
  const inputKeys = context.inputKeys;
  const [showPromptPlayground, setShowPromptPlayground] = useState(false);
  const content = data[hypothesisId];
  const parsedData = data.messages;
  const handleCellClick = (e: React.MouseEvent) => {
    console.log("some", content);
    console.log("prompt", prompt);
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
