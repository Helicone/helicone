import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tool } from "@helicone-package/llm-mapper/types";
import { useState } from "react";
import { PiPlusBold, PiToolboxBold, PiTrashBold } from "react-icons/pi";
import GlassHeader from "../universal/GlassHeader";
import UniversalPopup from "../universal/Popup";
import { ParameterLabel } from "./ParametersPanel";
// import ToolEditor from "./ToolEditor";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { logger } from "@/lib/telemetry/logger";
import { toSnakeCase } from "@/utils/strings";

interface ToolPanelProps {
  tools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

export default function ToolPanel({ tools, onToolsChange }: ToolPanelProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [toolJson, setToolJson] = useState(
    '{\n  "name": "",\n  "description": "",\n  "parameters": {\n    "type": "object",\n    "properties": {},\n    "required": []\n  }\n}',
  );

  const getParameters = (tool: Tool): string[] => {
    if (tool.parameters?.properties) {
      return Object.keys(tool.parameters.properties);
    }
    return [];
  };

  const handleAddTool = () => {
    try {
      const tool: Tool = JSON.parse(toolJson);
      tool.name = toSnakeCase(tool.name); // Ensure name is in snake_case
      onToolsChange([...tools, tool]);
      setIsPopupOpen(false);
    } catch (e) {
      logger.error({ error: e }, "Invalid tool JSON");
    }
  };

  const handleDeleteTool = (index: number) => {
    const newTools = [...tools];
    newTools.splice(index, 1);
    onToolsChange(newTools);
  };

  const isValidJson = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
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
                  <PiPlusBold className="h-4 w-4 text-secondary" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>New Tool</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </GlassHeader>
      <div className="divide-y divide-slate-100 px-4 dark:divide-slate-900">
        {tools.map((tool, index) => (
          <div key={index} className="flex flex-col gap-1 py-2 first:pt-0">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-1">
                  <ParameterLabel
                    icon={<PiToolboxBold className="mt-1 text-secondary" />}
                  >
                    {tool.name}({getParameters(tool).join(", ")})
                  </ParameterLabel>
                  <span className="text-tertiary text-xs">
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
                      <PiTrashBold className="h-4 w-4" />
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
          <div className="text-tertiary py-2 text-center text-sm">
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
        <div className="flex flex-col gap-6 p-4">
          <div className="h-[500px]">
            <MarkdownEditor
              text={toolJson}
              setText={setToolJson}
              language="json"
              className="h-full rounded-lg bg-white"
            />
          </div>
          <div className="flex flex-row items-center justify-end gap-2">
            {!isValidJson(toolJson) && (
              <p className="text-sm text-red-500">Invalid JSON</p>
            )}
            <Button variant="outline" onClick={() => setIsPopupOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="action"
              onClick={handleAddTool}
              disabled={!isValidJson(toolJson)}
            >
              Save Tool
            </Button>
          </div>
        </div>
      </UniversalPopup>
    </div>
  );
}
