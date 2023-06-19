import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import ThemedTimeFilter from "../../shared/themed/themedTimeFilter";
import DatePicker from "./datePicker";
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
      <DatePicker />
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
