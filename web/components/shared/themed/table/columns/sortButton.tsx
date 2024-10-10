import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Column } from "@tanstack/react-table";
import { useRouter } from "next/router";
import { Row } from "@/components/layout/common/row";

interface SortButtonProps<T> {
  columns: Column<T, unknown>[];
}

export default function SortButton<T>(props: SortButtonProps<T>) {
  const { columns } = props;
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <BarsArrowDownIcon className="h-4 w-4" />
          <span className="sr-only">Sort</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <Row className="p-2 gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const { sortDirection, sortKey, ...restQuery } = router.query;
              router.push({
                pathname: router.pathname,
                query: restQuery,
              });
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
          <Select
            onValueChange={(option) => {
              router.push(
                {
                  pathname: router.pathname,
                  query: { ...router.query, sortKey: option },
                },
                undefined
              );
            }}
            value={router.query.sortKey as string}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a column" />
            </SelectTrigger>
            <SelectContent>
              {columns
                .filter((column) => column.columnDef.meta?.sortKey)
                .map((column) => (
                  <SelectItem
                    key={column.columnDef.meta?.sortKey}
                    value={column.columnDef.meta?.sortKey!}
                  >
                    {column.columnDef.id ?? ""}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Switch
            checked={router.query.sortDirection === "asc"}
            onCheckedChange={(checked) => {
              router.push(
                {
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    sortDirection: checked ? "asc" : "desc",
                  },
                },
                undefined
              );
            }}
          />
          {router.query.sortDirection === "asc" ? (
            <BarsArrowUpIcon className="h-4 w-4" />
          ) : (
            <BarsArrowDownIcon className="h-4 w-4" />
          )}
        </Row>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
