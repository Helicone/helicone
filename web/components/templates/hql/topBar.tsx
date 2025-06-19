import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Play } from "lucide-react";
import { useState } from "react";
import { $JAWN_API } from "@/lib/clients/jawn";

interface TopBarProps {
  sql: string;
  setResult: (result: Array<Record<string, any>>) => void;
  setQueryLoading: (loading: boolean) => void;
}

export default function TopBar({
  sql,
  setResult,
  setQueryLoading,
}: TopBarProps) {
  // TODO: can be untitled query hash
  const [queryName, setQueryName] = useState("Untitled query");

  return (
    <div className="border-b bg-card w-full">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Input
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            className="text-lg font-medium border-none bg-transparent focus-visible:ring-0 w-48"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="action"
            size="sm"
            className="w-32"
            onClick={async () => {
              setQueryLoading(true);
              const result = await $JAWN_API.POST("/v1/helicone-sql/execute", {
                body: {
                  sql: sql,
                },
              });
              setQueryLoading(false);

              if (!result.error) {
                setResult(result.data?.data ?? []);
              }
              return result;
            }}
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>

          <Button variant="outline" size="sm" className="w-32">
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
