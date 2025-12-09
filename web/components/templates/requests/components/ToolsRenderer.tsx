import MarkdownEditor from "@/components/shared/markdownEditor";
import { useRequestRenderModeStore } from "@/store/requestRenderModeStore";
import { JsonRenderer } from "./chatComponent/single/JsonRenderer";
import { Button } from "@/components/ui/button";
import { ClipboardIcon, ClipboardCheckIcon, ChevronDown } from "lucide-react";
import { useState } from "react";
import { RoleBadge, getHeaderTint } from "./chatComponent/RoleBadge";
import { cn } from "@/lib/utils";

interface ToolsRendererProps {
  tools: any[] | undefined;
  chatMode: "PLAYGROUND_INPUT" | "PLAYGROUND_OUTPUT" | "DEFAULT";
}

interface ToolCardProps {
  tool: any;
  isLast: boolean;
}

function ToolCard({ tool, isLast }: ToolCardProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [isParametersOpen, setIsParametersOpen] = useState(false);

  const name = tool.function?.name || tool.name;
  const description = tool.function?.description || tool.description;
  const parameters = tool.function?.parameters || tool.parameters;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-3",
        !isLast && "border-b border-border"
      )}
    >
      {/* Tool name */}
      <div className="flex items-center gap-2">
        <code className="rounded bg-slate-200 px-2 py-0.5 text-sm font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-200">
          {name}
        </code>
      </div>

      {/* Description - collapsible */}
      {description && (
        <div className="flex flex-col">
          <button
            onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
            className="flex items-center gap-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              size={14}
              className={cn(
                "transition-transform duration-200",
                isDescriptionOpen && "rotate-180"
              )}
            />
            <span>Description</span>
          </button>
          {isDescriptionOpen && (
            <div className="mt-2 rounded-md border border-border bg-background p-3">
              <p className="text-sm text-secondary">{description}</p>
            </div>
          )}
        </div>
      )}

      {/* Parameters - collapsible */}
      {parameters && (
        <div className="flex flex-col">
          <button
            onClick={() => setIsParametersOpen(!isParametersOpen)}
            className="flex items-center gap-1.5 text-left text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown
              size={14}
              className={cn(
                "transition-transform duration-200",
                isParametersOpen && "rotate-180"
              )}
            />
            <span>Parameters</span>
          </button>
          {isParametersOpen && (
            <div className="mt-2 rounded-md border border-border bg-background p-3">
              <JsonRenderer data={parameters} copyButtonPosition="top-right" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ToolsRenderer({ tools, chatMode }: ToolsRendererProps) {
  const [copied, setCopied] = useState(false);
  const { mode: renderMode } = useRequestRenderModeStore();

  if (chatMode !== "DEFAULT" || !tools || tools.length === 0) {
    return null;
  }

  if (renderMode === "json" || renderMode === "debug" || renderMode === "chat") {
    return null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(tools, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const headerTint = getHeaderTint("tools");

  const ToolsHeader = () => (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-12 w-full flex-row items-center justify-between px-4",
        headerTint
      )}
    >
      <div className="flex items-center gap-2">
        <RoleBadge role="tools" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? (
            <ClipboardCheckIcon className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <ClipboardIcon className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">
        {tools.length} tool{tools.length !== 1 ? "s" : ""}
      </span>
    </header>
  );

  if (renderMode === "raw") {
    return (
      <div className="border-t border-border">
        <ToolsHeader />
        <div className="px-4 pb-4 pt-2">
          <MarkdownEditor
            language="json"
            setText={() => {}}
            text={JSON.stringify(tools, null, 2)}
            disabled
          />
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border">
      <ToolsHeader />
      <div className="px-4 pb-4 pt-2">
        <div className="rounded-lg border border-border bg-card">
          <div className="px-4">
            {tools.map((tool: any, index: number) => (
              <ToolCard
                key={index}
                tool={tool}
                isLast={index === tools.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
