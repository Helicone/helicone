import { Tool } from "packages/llm-mapper/types";
import { PiToolboxBold } from "react-icons/pi";

interface ToolPanelProps {
  tools: Tool[];
}

export default function ToolPanel({ tools }: ToolPanelProps) {
  const getParameters = (tool: Tool): string[] => {
    if (tool.parameters?.properties) {
      return Object.keys(tool.parameters.properties);
    }
    if (tool.input_schema?.properties) {
      return Object.keys(tool.input_schema.properties);
    }
    return [];
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="h-8 flex items-center justify-between">
        <h2 className="font-semibold text-secondary">Tools</h2>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-900">
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
          <div className="py-2 text-sm text-tertiary">No tools configured</div>
        )}
      </div>
    </div>
  );
}
