import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import clsx from "clsx";
import PromptPlayground from "../../../id/promptPlayground";

export const OriginalMessagesCellRenderer: React.FC<any> = (params) => {
  const { data, colDef, _context, prompt, wrapText } = params;
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
          className={`flex h-full w-full items-center ${
            content ? "justify-start" : "justify-end"
          }`}
          onClick={handleCellClick}
        >
          {content && content !== "{}" ? (
            <div className={clsx(wrapText && "whitespace-pre-wrap")}>
              {content}
            </div>
          ) : (
            <div></div>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0" side="bottom" align="start">
        <ScrollArea className="flex max-h-[50vh] flex-col overflow-y-auto">
          <PromptPlayground
            prompt={formatPromptForPlayground() || ""}
            selectedInput={data}
            onSubmit={(_history, _model) => {
              setShowPromptPlayground(false);
            }}
            submitText="Save"
            initialModel={prompt?.model || ""}
            isPromptCreatedFromUi={false}
            defaultEditMode={false}
            editMode={false}
            playgroundMode="experiment"
            chatType="request"
          />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
