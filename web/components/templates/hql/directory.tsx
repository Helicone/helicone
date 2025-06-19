import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    <div className="w-80 h-screen bg-background border-r flex flex-col">
      {/* Tabs */}
      <section className="flex border-b">
        <button className="flex-1 px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary">
          Tables
        </button>
        <button className="flex-1 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
          Queries
        </button>
      </section>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search resources" className="pl-9 h-9" />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Tables ({tables.length})
              </h3>
            </div>

            <div className="space-y-1">
              {tables.map((table, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                >
                  <span className="text-sm font-medium truncate pr-2">
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
