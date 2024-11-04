import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@heroicons/react/24/outline";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PromptPlayground from "../../../id/promptPlayground";
import { ScrollArea } from "@/components/ui/scroll-area";

import clsx from "clsx";
import { CellData } from "./types";

export const OriginalOutputCellRenderer: React.FC<any> = (params) => {
  const { data, colDef, context, prompt, wrapText } = params;
  const hypothesisId = params.hypothesisId;
  const inputKeys = context.inputKeys;
  const [showPromptPlayground, setShowPromptPlayground] = useState(false);
  const cellData = data.cells[colDef.cellRendererParams.columnId] as CellData;

  const content = useMemo(() => {
    const message = cellData?.value?.response?.choices?.[0]?.message;

    // If there's direct content, use it
    if (message?.content) {
      return message.content;
    }

    // If there are tool calls, extract the content from the arguments
    if (message?.tool_calls?.[0]?.function?.arguments) {
      try {
        const args = JSON.parse(message.tool_calls[0].function.arguments);
        return args.content || "";
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
        return "";
      }
    }

    return "";
  }, [cellData]);

  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPromptPlayground(true);
  };

  const formatPromptForPlayground = (): any => {
    return {
      model: prompt?.model || "",
      messages: [
        ...(prompt?.helicone_template?.messages || []),
        {
          role: "assistant",
          content: content,
        },
      ],
    };
  };

  if (cellData?.status === "running") {
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
                  params.handleRunHypothesis("original", [
                    {
                      cellId: cellData.cellId,
                      columnId: colDef.cellRendererParams.columnId,
                    },
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
            playgroundMode="experiment"
            chatType="response"
          />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
