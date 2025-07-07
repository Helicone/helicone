import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { components } from "@/lib/clients/jawnTypes/public";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useState } from "react";
import { clsx } from "clsx";

interface DirectoryProps {
  tables: {
    table_name: string;
    columns: components["schemas"]["ClickHouseTableColumn"][];
  }[];
}

export function Directory({ tables }: DirectoryProps) {
  const [activeTab, setActiveTab] = useState<"tables" | "queries">("tables");
  const [savedQueries, setSavedQueries] = useState<any[]>([]); // Adjust type as needed
  const [loadingQueries, setLoadingQueries] = useState(false);

  const fetchSavedQueries = async () => {
    setLoadingQueries(true);
    const res = await $JAWN_API.GET("/v1/helicone-sql/saved-queries");
    setSavedQueries(res.data?.data || []);
    setLoadingQueries(false);
  };

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
            fetchSavedQueries();
          }}
        >
          Queries
        </button>
      </section>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input placeholder="Search resources" className="h-9 pl-9" />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4">
            {activeTab === "tables" ? (
              <TableList tables={tables} />
            ) : (
              <QueryList queries={savedQueries} loading={loadingQueries} />
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function TableList({ tables }: { tables: any[] }) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Tables ({tables.length})
        </h3>
      </div>
      <div className="space-y-1">
        {tables.map((table, index) => (
          <div
            key={index}
            className="group flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50"
          >
            <span className="truncate pr-2 text-sm font-medium">
              {table.table_name}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function QueryList({ queries, loading }: { queries: any[]; loading: boolean }) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Queries ({queries.length})
        </h3>
      </div>
      {loading ? (
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
