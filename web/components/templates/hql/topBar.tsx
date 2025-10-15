import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VisualizationConfig } from "@/lib/clients/jawnTypes/private";

interface TopBarProps {
  currentQuery: {
    id?: string;
    name: string;
    sql: string;
    visualization_config?: VisualizationConfig;
  };
  handleExecuteQuery: (sql: string) => void;
  handleSaveQuery: (savedQuery: {
    id?: string;
    name: string;
    sql: string;
    visualization_config?: VisualizationConfig;
  }) => void;
  handleRenameQuery: (newName: string) => void;
}

export default function TopBar({
  currentQuery,
  handleExecuteQuery,
  handleSaveQuery,
  handleRenameQuery,
}: TopBarProps) {
  return (
    <div className="flex w-full shrink-0 flex-col border-b bg-background dark:border-border">
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
                visualization_config: currentQuery.visualization_config,
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
