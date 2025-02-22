import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tool } from "packages/llm-mapper/types";
import { PiPlusBold, PiToolboxBold } from "react-icons/pi";
import GlassHeader from "../universal/GlassHeader";

interface ToolPanelProps {
  tools: Tool[];
}

export default function ToolPanel({ tools }: ToolPanelProps) {
  const getParameters = (tool: Tool): string[] => {
    if (tool.parameters?.properties) {
      return Object.keys(tool.parameters.properties);
    }
    return [];
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <GlassHeader className="h-14 px-4">
        <h2 className="font-semibold text-secondary">Tools</h2>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant={"outline"}
                  size={"square_icon"}
                  asPill
                  disabled={true}
                  onClick={() => {}}
                >
                  <PiPlusBold className="w-4 h-4 text-secondary" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add a tool to your prompt (coming soon)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </GlassHeader>
      <div className="divide-y divide-slate-100 dark:divide-slate-900 px-4">
        {tools.map((tool, index) => (
          <div key={index} className="flex flex-col gap-1 py-2 first:pt-0">
            <div className="flex items-start gap-2">
              <PiToolboxBold className="text-secondary mt-1" />
              <div className="flex flex-col gap-1">
                <code className="text-sm font-mono text-secondary">
                  {tool.name}({getParameters(tool).join(", ")})
                </code>
                <span className="text-xs text-tertiary">
                  {tool.description}
                </span>
              </div>
            </div>
          </div>
        ))}
        {tools.length === 0 && (
          <div className="py-2 text-sm text-tertiary text-center">
            No tools configured.
          </div>
        )}
      </div>
    </div>
  );
}
