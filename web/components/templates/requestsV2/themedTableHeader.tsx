import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import ViewColumns from "./viewColumns";

interface ThemedTableHeaderProps<T> {
  columns: Column<T, unknown>[];
  onSelectAll: (value?: boolean | undefined) => void;
  visibleColumns: number;
}

export default function ThemedTableHeader<T>(props: ThemedTableHeaderProps<T>) {
  const { columns, onSelectAll, visibleColumns } = props;

  return (
    <div className="flex flex-row justify-between">
      <ThemedTimeFilter
        custom={true}
        timeFilterOptions={[
          { key: "24h", value: "Today" },
          { key: "7d", value: "7D" },
          { key: "1m", value: "1M" },
          { key: "3m", value: "3M" },
          { key: "all", value: "All" },
        ]}
        onSelect={(key, value) => console.log(key)}
        isFetching={false}
        defaultValue={"24h"}
      />
      <div className="flex flex-row gap-2">
        <ViewColumns
          columns={columns}
          onSelectAll={onSelectAll}
          visibleColumns={visibleColumns}
        />
      </div>
    </div>
  );
}
