import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { $JAWN_API } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/public";

interface TopBarProps {
  currentQuery: {
    id?: string;
    sql: string;
  };
  handleExecuteQuery: (sql: string) => void;
  handleSaveQuery: (savedQuery: {
    id?: string;
    name: string;
    sql: string;
    path: string;
  }) => void;
}

export default function TopBar({
  currentQuery,
  handleExecuteQuery,
  handleSaveQuery,
}: TopBarProps) {
  // TODO: can be untitled query hash

  useEffect(() => {
    console.log(currentQuery);
  }, [currentQuery]);

  return (
    <div className="w-full border-b bg-card">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-4">
          <Input
            value={"Untitled query"}
            onChange={(e) => {}}
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
              const name = "Untitled query";
              handleSaveQuery({
                id: currentQuery.id,
                name: name,
                sql: currentQuery.sql,
                path: "/",
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
