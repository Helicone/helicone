import { Plus, Search, Table } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { components } from "@/lib/clients/jawnTypes/public";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useMutation } from "@tanstack/react-query";
import useNotification from "@/components/shared/notification/useNotification";
import { useDeleteQueryMutation, useSaveQueryMutation } from "./constants";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { $JAWN_API } from "@/lib/clients/jawn";
import { CommandLineIcon } from "@heroicons/react/24/outline";
import { useBulkDeleteQueryMutation } from "./constants";

interface DirectoryProps {
  tables: {
    table_name: string;
    columns: components["schemas"]["ClickHouseTableColumn"][];
  }[];
  currentQuery: {
    id: string | undefined;
    name: string;
    sql: string;
  };
  setCurrentQuery: Dispatch<
    SetStateAction<{
      id: string | undefined;
      name: string;
      sql: string;
    }>
  >;
  activeTab: "tables" | "queries";
  setActiveTab: Dispatch<SetStateAction<"tables" | "queries">>;
}

export function Directory({
  tables,
  currentQuery,
  setCurrentQuery,
  activeTab,
  setActiveTab,
}: DirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { setNotification } = useNotification();

  const { mutateAsync: handleSaveQueryAsync } = useMutation(
    useSaveQueryMutation(setCurrentQuery, setNotification),
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
    <div className="flex h-screen flex-col overflow-hidden border-r bg-background">
      {/* Tabs */}
      <section className="flex border-b">
        <button
          className={clsx(
            "flex-1 truncate border-b-2 px-2 py-3 text-sm font-medium sm:px-4",
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
            "flex-1 truncate border-b-2 px-2 py-3 text-sm font-medium sm:px-4",
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
                      setCurrentQuery({
                        id,
                        name: "Untitled query",
                        sql: "select * from request_response_rmt",
                      });
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
              <QueryList
                queries={queries}
                isLoading={isLoading}
                currentQuery={currentQuery}
                setCurrentQuery={setCurrentQuery}
              />
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
              <div className="flex min-w-0 items-center gap-2">
                {expandedTables.has(table.table_name) ? (
                  <ChevronDown className="flex-shrink-0" size={16} />
                ) : (
                  <ChevronRight className="flex-shrink-0" size={16} />
                )}
                <Table className="flex-shrink-0" size={16} />
                <span className="truncate text-sm">{table.table_name}</span>
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
  currentQuery,
  setCurrentQuery,
}: {
  queries: components["schemas"]["HqlSavedQuery"][];
  isLoading: boolean;
  currentQuery: {
    id: string | undefined;
    name: string;
    sql: string;
  };
  setCurrentQuery: Dispatch<
    SetStateAction<{
      id: string | undefined;
      name: string;
      sql: string;
    }>
  >;
}) {
  const { setNotification } = useNotification();
  const [selectedQueries, setSelectedQueries] = useState<Set<string>>(
    new Set(),
  );

  const deleteQueryMutation = useMutation(
    useDeleteQueryMutation(setNotification),
  );

  const bulkDeleteMutation = useMutation(
    useBulkDeleteQueryMutation(setNotification),
  );

  const handleDeleteQuery = (queryId: string, queryName: string) => {
    if (confirm(`Are you sure you want to delete "${queryName}"?`)) {
      deleteQueryMutation.mutate(queryId);
    }
  };

  const handleBulkDelete = () => {
    const count = selectedQueries.size;
    if (
      confirm(
        `Are you sure you want to delete ${count} selected ${count === 1 ? "query" : "queries"}?`,
      )
    ) {
      bulkDeleteMutation.mutate(Array.from(selectedQueries));
      setSelectedQueries(new Set());
    }
  };

  const toggleQuerySelection = (queryId: string) => {
    setSelectedQueries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(queryId)) {
        newSet.delete(queryId);
      } else {
        newSet.add(queryId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedQueries.size === queries.length) {
      setSelectedQueries(new Set());
    } else {
      setSelectedQueries(new Set(queries.map((q) => q.id)));
    }
  };

  return (
    <>
      {/* Show current unsaved query */}
      {!currentQuery.id && (
        <div className="mb-3">
          <div className="flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 px-3 py-2 dark:border-orange-800 dark:bg-orange-950/20">
            <div className="flex items-center gap-2">
              <CommandLineIcon className="h-4 w-4" />
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {currentQuery.name}
              </span>
              <span className="text-xs text-orange-600 dark:text-orange-400">
                (Unsaved)
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {queries.length > 0 && (
            <Checkbox
              checked={selectedQueries.size === queries.length}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all queries"
            />
          )}
          <h3 className="text-sm font-medium text-muted-foreground">
            Queries ({queries.length})
          </h3>
        </div>
        {selectedQueries.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Delete ({selectedQueries.size})
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-1">
          {queries.map((query, index) => (
            <ContextMenu key={query.id || index}>
              <ContextMenuTrigger>
                <div className="group flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedQueries.has(query.id)}
                      onCheckedChange={() => toggleQuerySelection(query.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${query.name}`}
                    />
                    <span
                      className="flex items-center gap-2 truncate pr-2 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentQuery({
                          id: query.id,
                          name: query.name,
                          sql: query.sql,
                        });
                      }}
                    >
                      <CommandLineIcon className="h-4 w-4" />
                      {query.name}
                    </span>
                  </div>
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
