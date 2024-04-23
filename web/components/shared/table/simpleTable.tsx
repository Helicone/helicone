import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";

type ColumnConfig<T> = {
  key: keyof T; // Ensures that `key` is a valid property of T
  header: string;
  render: (item: T) => React.ReactNode; // Type-safe render function
};

interface SimpleTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  tableHeader?: string;
  emptyMessage?: string; // what to display when data is empty
}

export function SimpleTable<T>(props: SimpleTableProps<T>) {
  const {
    data,
    columns,
    tableHeader,
    emptyMessage = "No data available",
  } = props;
  return (
    <Card className="p-2">
      {tableHeader && tableHeader !== "" && (
        <h3 className="text-tremor-content-strong dark:text-dark-tremor-content-strong font-semibold">
          {tableHeader}
        </h3>
      )}
      <Table>
        <TableHead>
          <TableRow className="border-b border-gray-300">
            {columns.map((column) => (
              <TableHeaderCell key={String(column.key)}>
                {column.header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((item, index) => (
            <TableRow key={`row-${index}`}>
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {column.render(item)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {data.length === 0 && (
        <div className="h-48 w-full bg-white dark:bg-black flex items-center justify-center">
          <p className="text-tremor-content dark:text-dark-tremor-content mx-auto">
            {emptyMessage}
          </p>
        </div>
      )}
    </Card>
  );
}
