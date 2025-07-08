import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Play } from "lucide-react";

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
}

export default function TopBar({
  currentQuery,
  handleExecuteQuery,
  handleSaveQuery,
  handleRenameQuery,
}: TopBarProps) {
  return (
    <div className="w-full border-b bg-card">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Input
            value={currentQuery.name}
            onChange={(e) => {
              const newName = e.target.value;
              handleRenameQuery(newName);
            }}
            className="w-48 border-none bg-transparent text-lg font-medium focus-visible:ring-0"
          />
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
            variant="outline"
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
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
