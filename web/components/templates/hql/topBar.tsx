import { Button } from "@/components/ui/button";
import { Save, Play, X, Plus, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { clsx } from "clsx";
import { QueryTab } from "./hqlPage";

interface TopBarProps {
  currentQuery: {
    id?: string;
    name: string;
    sql: string;
  };
  handleExecuteQuery: (sql: string) => void;
  handleSaveQuery: (savedQuery: {
    id?: string;
    name: string;
    sql: string;
  }) => void;
  handleRenameQuery: (newName: string) => void;
  onOpenAssistant?: () => void;
  // Tab props - optional for backwards compatibility
  tabs?: QueryTab[];
  activeTabId?: string;
  onTabSwitch?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: () => void;
  maxTabs?: number;
}

export default function TopBar({
  currentQuery,
  handleExecuteQuery,
  handleSaveQuery,
  handleRenameQuery,
  onOpenAssistant,
  tabs,
  activeTabId,
  onTabSwitch,
  onTabClose,
  onNewTab,
  maxTabs,
}: TopBarProps) {
  const showTabs = tabs && tabs.length > 0 && activeTabId && onTabSwitch && onTabClose && onNewTab;

  return (
    <div className="flex w-full shrink-0 flex-col border-b bg-background dark:border-border">
      {/* Tab Bar - only shown when tabs are provided */}
      {showTabs && (
        <div className="flex items-center overflow-x-auto border-b bg-muted/30 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={clsx(
                "group flex cursor-pointer items-center gap-1 border-r border-border px-3 py-2",
                tab.id === activeTabId
                  ? "border-b-2 border-b-primary bg-background"
                  : "hover:bg-muted/50"
              )}
              onClick={() => onTabSwitch(tab.id)}
            >
              <span className="max-w-[120px] truncate text-sm">
                {tab.name}
              </span>
              {tab.isDirty && (
                <span className="text-primary">*</span>
              )}
              {tabs.length > 1 && (
                <button
                  className="ml-1 rounded p-0.5 opacity-0 hover:bg-muted group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          {tabs.length < (maxTabs || 10) && (
            <button
              className="flex items-center gap-1 px-3 py-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              onClick={onNewTab}
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      )}

      {/* Query Controls */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              value={currentQuery.name}
              onChange={(e) => {
                const newName = e.target.value;
                handleRenameQuery(newName);
              }}
              className="w-48 border-none bg-transparent text-lg font-medium focus-visible:ring-0"
            />
            {!currentQuery.id && (
              <Badge variant="secondary" className="text-xs">
                Unsaved
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAssistant && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAssistant}
            >
              <Bot size={16} className="mr-1" />
              Assistant
            </Button>
          )}

          <Button
            variant="action"
            size="sm"
            className="w-32"
            onClick={async () => {
              handleExecuteQuery(currentQuery.sql);
            }}
          >
            <Play className="mr-1 h-4 w-4" />
            Run
          </Button>

          <Button
            variant={!currentQuery.id ? "action" : "outline"}
            size="sm"
            className="w-32"
            onClick={() => {
              handleSaveQuery({
                id: currentQuery.id,
                name: currentQuery.name,
                sql: currentQuery.sql,
              });
            }}
          >
            <Save className="mr-1 h-4 w-4" />
            {!currentQuery.id ? "Save Query" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
