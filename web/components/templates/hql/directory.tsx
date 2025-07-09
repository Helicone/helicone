import { Plus, Search, Table } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { components } from "@/lib/clients/jawnTypes/public";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useMutation } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";
import {
  createDeleteQueryMutation,
  createSaveQueryMutation,
} from "./constants";
import Router from "next/router";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { $JAWN_API } from "@/lib/clients/jawn";

interface DirectoryProps {
  tables: {
    table_name: string;
    columns: components["schemas"]["ClickHouseTableColumn"][];
  }[];
  setCurrentQuery: Dispatch<
    SetStateAction<{
      id: string | undefined;
      name: string;
      sql: string;
    }>
  >;
}

export function Directory({ tables, setCurrentQuery }: DirectoryProps) {
  const [activeTab, setActiveTab] = useState<"tables" | "queries">("tables");
  const [searchTerm, setSearchTerm] = useState("");
  const { setNotification } = useNotification();

  const { mutateAsync: handleSaveQueryAsync } = useMutation(
    createSaveQueryMutation(setCurrentQuery, setNotification),
  );

  const filteredTables = useMemo(
    () =>
      tables.filter((table) =>
        table.table_name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [tables, searchTerm],
  );

  const { data: savedQueries, isLoading } = $JAWN_API.useQuery(
    "get",
    "/v1/helicone-sql/saved-queries",
  );

  const queries = useMemo(
    () =>
      savedQueries?.data?.filter((q) =>
        q.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ) || [],
    [savedQueries, searchTerm],
  );

  return (
    <div className="flex h-screen w-80 flex-col border-r bg-background">
      {/* Tabs */}
      <section className="flex border-b">
        <button
          className={clsx(
            "flex-1 border-b-2 px-4 py-3 text-sm font-medium",
            activeTab === "tables"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setActiveTab("tables")}
        >
          Tables
        </button>
        <button
          className={clsx(
            "flex-1 border-b-2 px-4 py-3 text-sm font-medium",
            activeTab === "queries"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
          onClick={() => {
            setActiveTab("queries");
          }}
        >
          Queries
        </button>
      </section>

      {activeTab === "queries" && (
        <div className="mt-4 px-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="flex w-full items-center justify-center gap-4 rounded-md px-3 py-2 pr-5 hover:bg-tremor-brand-subtle"
                  onClick={async () => {
                    const response = await handleSaveQueryAsync({
                      id: undefined,
                      name: "Untitled query",
                      sql: "select * from request_response_rmt",
                    });

                    const data = response.data?.data;
                    const id = Array.isArray(data) ? data[0]?.id : data?.id;
                    if (id) {
                      Router.replace(`/hql/${id}`);
                    }
                  }}
                >
                  <Plus size={16} />
                  New query
                </Button>
              </TooltipTrigger>
              <TooltipContent>Create new query</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
          />
          <Input
            placeholder={`Search ${activeTab === "tables" ? "tables" : "queries"}`}
            className="h-9 pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4">
            {activeTab === "tables" ? (
              <TableList tables={filteredTables} />
            ) : (
              <QueryList queries={queries} isLoading={isLoading} />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function TableList({ tables }: { tables: any[] }) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Tables ({tables.length})
        </h3>
      </div>
      <div className="space-y-1">
        {tables.map((table, index) => (
          <div key={index}>
            <div
              className="group flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50"
              onClick={() => toggleTable(table.table_name, setExpandedTables)}
            >
              <div className="flex items-center gap-2">
                {expandedTables.has(table.table_name) ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <Table size={16} />
                <span className="truncate pr-2 text-sm">
                  {table.table_name}
                </span>
              </div>
            </div>
            {expandedTables.has(table.table_name) && (
              <div className="mb-2 ml-6">
                {table.columns.map((col: any) => (
                  <div
                    key={col.name}
                    className="flex justify-between py-0.5 text-xs text-muted-foreground"
                  >
                    <span>{col.name}</span>
                    <span className="text-[10px]">{col.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function QueryList({
  queries,
  isLoading,
}: {
  queries: components["schemas"]["HqlSavedQuery"][];
  isLoading: boolean;
}) {
  const { setNotification } = useNotification();

  const deleteQueryMutation = useMutation(
    createDeleteQueryMutation(setNotification),
  );

  const handleDeleteQuery = (queryId: string, queryName: string) => {
    if (confirm(`Are you sure you want to delete "${queryName}"?`)) {
      deleteQueryMutation.mutate(queryId);
      Router.replace("/hql");
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Queries ({queries.length})
        </h3>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-1">
          {queries.map((query, index) => (
            <ContextMenu key={query.id || index}>
              <ContextMenuTrigger>
                <div className="group flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50">
                  <span className="flex items-center gap-2 truncate pr-2 text-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>

                    {query.name}
                  </span>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => handleDeleteQuery(query.id, query.name)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}
    </>
  );
}

const toggleTable = (
  tableName: string,
  setExpandedTables: React.Dispatch<React.SetStateAction<Set<string>>>,
) => {
  setExpandedTables((prev: Set<string>) => {
    const newSet = new Set(prev);
    if (newSet.has(tableName)) {
      newSet.delete(tableName);
    } else {
      newSet.add(tableName);
    }
    return newSet;
  });
};
