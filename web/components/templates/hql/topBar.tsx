import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Play } from "lucide-react";
import { useState } from "react";
import { $JAWN_API } from "@/lib/clients/jawn";

interface TopBarProps {
  sql: string;
  handleExecuteQuery: (sql: string) => void;
}

export default function TopBar({ sql, handleExecuteQuery }: TopBarProps) {
  // TODO: can be untitled query hash
  const [queryName, setQueryName] = useState("Untitled query");

  return (
    <div className="w-full border-b bg-card">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Input
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            className="w-48 border-none bg-transparent text-lg font-medium focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="action"
            size="sm"
            className="w-32"
            onClick={async () => {
              handleExecuteQuery(sql);
            }}
          >
            <Play className="mr-1 h-4 w-4" />
            Run
          </Button>

          <Button variant="outline" size="sm" className="w-32">
            <Save className="mr-1 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
