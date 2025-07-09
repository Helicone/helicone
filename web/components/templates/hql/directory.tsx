import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { components } from "@/lib/clients/jawnTypes/public";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useMemo, useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface DirectoryProps {
  tables: {
    table_name: string;
    columns: components["schemas"]["ClickHouseTableColumn"][];
  }[];
}

export function Directory({ tables }: DirectoryProps) {
  const [activeTab, setActiveTab] = useState<"tables" | "queries">("tables");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTables = useMemo(
    () =>
      tables.filter((table) =>
        table.table_name.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [tables, searchTerm],
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
              <QueryList searchTerm={searchTerm} />
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
                <span className="truncate pr-2 text-sm font-medium">
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

function QueryList({ searchTerm }: { searchTerm: string }) {
  const queryClient = useQueryClient();

  const savedQueries = queryClient.getQueryData<{
    data: components["schemas"]["HqlSavedQuery"][];
  }>(["get", "/v1/helicone-sql/saved-queries"]);

  const isLoading = queryClient.isFetching({
    queryKey: ["get", "/v1/helicone-sql/saved-queries"],
  });

  const queries = useMemo(
    () =>
      savedQueries?.data?.filter((query) =>
        query.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ) || [],
    [savedQueries, searchTerm],
  );

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
            <div
              key={query.id || index}
              className="group flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50"
            >
              <span className="truncate pr-2 text-sm font-medium">
                {query.name}
              </span>
            </div>
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
  setExpandedTables((prev) => {
    const newSet = new Set(prev);
    if (newSet.has(tableName)) {
      newSet.delete(tableName);
    } else {
      newSet.add(tableName);
    }
    return newSet;
  });
};
