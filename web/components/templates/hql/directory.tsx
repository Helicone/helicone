import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { components } from "@/lib/clients/jawnTypes/public";

interface DirectoryProps {
  tables: {
    table_name: string;
    columns: components["schemas"]["ClickHouseTableColumn"][];
  }[];
}

export function Directory({ tables }: DirectoryProps) {
  return (
    <div className="flex h-screen w-80 flex-col border-r bg-background">
      {/* Tabs */}
      <section className="flex border-b">
        <button className="flex-1 border-b-2 border-primary px-4 py-3 text-sm font-medium text-primary">
          Tables
        </button>
        <button className="flex-1 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
          {/* TODO: will eventually support saving multiple queries */}
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
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
