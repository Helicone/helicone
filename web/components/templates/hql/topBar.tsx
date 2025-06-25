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
  setQueryError: (error: string) => void;
}

export default function TopBar({
  sql,
  setResult,
  setQueryLoading,
  setQueryError,
}: TopBarProps) {
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
              setQueryLoading(true);
              const result = await $JAWN_API.POST("/v1/helicone-sql/execute", {
                body: {
                  sql: sql,
                },
              });
              setQueryLoading(false);

              if ("data" in result && result.data) {
                setResult(result.data?.data ?? []);
              } else if ("error" in result) {
                setQueryError((result.error as { message: string }).message);
              }
              return result;
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
