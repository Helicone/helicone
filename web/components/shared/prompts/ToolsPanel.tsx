import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tool } from "packages/llm-mapper/types";
import { useState } from "react";
import { PiPlusBold, PiToolboxBold, PiTrashBold } from "react-icons/pi";
import GlassHeader from "../universal/GlassHeader";
import UniversalPopup from "../universal/Popup";
import { ParameterLabel } from "./ParametersPanel";
import ToolEditor from "./ToolEditor";

interface ToolPanelProps {
  tools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

export default function ToolPanel({ tools, onToolsChange }: ToolPanelProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const getParameters = (tool: Tool): string[] => {
    if (tool.parameters?.properties) {
      return Object.keys(tool.parameters.properties);
    }
    return [];
  };

  const handleAddTool = (tool: Tool) => {
    onToolsChange([...tools, tool]);
    setIsPopupOpen(false);
  };

  const handleDeleteTool = (index: number) => {
    const newTools = [...tools];
    newTools.splice(index, 1);
    onToolsChange(newTools);
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <GlassHeader className="h-14 px-4">
        <h2 className="font-semibold text-secondary">Tools</h2>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant={"outline"}
                  size={"square_icon"}
                  asPill
                  onClick={() => setIsPopupOpen(true)}
                >
                  <PiPlusBold className="w-4 h-4 text-secondary" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>New Tool</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </GlassHeader>
      <div className="divide-y divide-slate-100 dark:divide-slate-900 px-4">
        {tools.map((tool, index) => (
          <div key={index} className="flex flex-col gap-1 py-2 first:pt-0">
            <div className="flex flex-row gap-2 items-center justify-between">
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-1">
                  <ParameterLabel
                    icon={<PiToolboxBold className="text-secondary mt-1" />}
                  >
                    {tool.name}({getParameters(tool).join(", ")})
                  </ParameterLabel>
                  <span className="text-xs text-tertiary">
                    {tool.description}
                  </span>
                </div>
              </div>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={"ghost"}
                      size={"square_icon"}
                      onClick={() => handleDeleteTool(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <PiTrashBold className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Tool</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ))}
        {tools.length === 0 && (
          <div className="py-2 text-sm text-tertiary text-center">
            No <span className="font-semibold">Tools</span> configured.
          </div>
        )}
      </div>

      {/* Tool Creation Popup */}
      <UniversalPopup
        title="New Tool"
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        width="max-w-5xl w-full"
      >
        <ToolEditor
          onSave={handleAddTool}
          onCancel={() => setIsPopupOpen(false)}
        />
      </UniversalPopup>
    </div>
  );
}
