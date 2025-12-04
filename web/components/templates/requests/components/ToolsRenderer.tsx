import MarkdownEditor from "@/components/shared/markdownEditor";
import { useRequestRenderModeStore } from "@/store/requestRenderModeStore";
import { JsonRenderer } from "./chatComponent/single/JsonRenderer";
import { Button } from "@/components/ui/button";
import { ClipboardIcon, ClipboardCheckIcon } from "lucide-react";
import { useState } from "react";
import { RoleBadge, getHeaderTint } from "./chatComponent/RoleBadge";
import { cn } from "@/lib/utils";

interface ToolsRendererProps {
  tools: any[] | undefined;
  chatMode: "PLAYGROUND_INPUT" | "PLAYGROUND_OUTPUT" | "DEFAULT";
}

export default function ToolsRenderer({ tools, chatMode }: ToolsRendererProps) {
  const [copied, setCopied] = useState(false);
  const { mode: renderMode } = useRequestRenderModeStore();

  if (chatMode !== "DEFAULT" || !tools || tools.length === 0) {
    return null;
  }

  if (renderMode === "json" || renderMode === "debug") {
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
          className="h-4 w-4 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? (
            <ClipboardCheckIcon className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <ClipboardIcon className="h-3 w-3" />
          )}
        </Button>
      </div>
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
        <div className="rounded-md border border-border bg-muted p-3">
          <div className="divide-y divide-border">
            {tools.map((tool: any, index: number) => (
              <div
                key={index}
                className={`space-y-1 ${index > 0 ? "pt-3" : ""} ${index < tools.length - 1 ? "pb-3" : ""}`}
              >
                <div className="text-sm font-medium text-secondary">
                  {tool.function?.name || tool.name}
                </div>
                {(tool.function?.description || tool.description) && (
                  <div className="text-xs text-muted-foreground">
                    {tool.function?.description || tool.description}
                  </div>
                )}
                {(tool.function?.parameters || tool.parameters) && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Parameters
                    </summary>
                    <div className="mt-1 rounded border border-border bg-background p-2">
                      <JsonRenderer
                        data={tool.function?.parameters || tool.parameters}
                        copyButtonPosition="top-right"
                      />
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
