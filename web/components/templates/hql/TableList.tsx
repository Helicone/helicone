import React, { useState, useCallback } from "react";
import { Table, ChevronDown, ChevronRight } from "lucide-react";
import { TableSchema } from "./types";

interface TableListProps {
  tables: TableSchema[];
}

const TableList: React.FC<TableListProps> = React.memo(({ tables }) => {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = useCallback((tableName: string) => {
    setExpandedTables((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      return newSet;
    });
  }, []);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Tables ({tables.length})
        </h3>
      </div>
      <div className="space-y-1">
        {tables.map((table) => (
          <div key={table.table_name}>
            <div
              className="group flex cursor-pointer items-center justify-between rounded-md px-2 py-2 hover:bg-muted/50"
              onClick={() => toggleTable(table.table_name)}
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
                {table.columns.map((col) => (
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
});

TableList.displayName = "TableList";

export default TableList;