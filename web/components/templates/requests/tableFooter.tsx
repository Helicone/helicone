import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "../../../services/hooks/debounce";

interface TableFooterProps {
  currentPage: number;
  pageSize: number;
  count: number;
  isCountLoading: boolean;
  onPageChange: (newPageNumber: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  pageSizeOptions: number[];
  showCount?: boolean;
}

export default function TableFooter(props: TableFooterProps) {
  const {
    currentPage,
    pageSize,
    count,
    isCountLoading,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions,
    showCount = false,
  } = props;

  const totalPages = Math.ceil(count / pageSize);
  const [page, setPage] = useState<number>(currentPage);

  const debouncedPage = useDebounce(page, 1200);

  useEffect(() => {
    if (debouncedPage !== currentPage) {
      onPageChange(debouncedPage);
    }
  }, [debouncedPage, currentPage, onPageChange]);
  return (
    <footer className="flex flex-row gap-4 items-center w-full justify-between text-xs px-4 py-2 bg-slate-100 dark:bg-slate-900 border-t border-border">
      {/* Left Actions */}
      <div className="flex flex-row gap-1 items-center">
        <p className="text-muted-foreground font-medium hidden sm:block">
          Rows
        </p>
        <Select
          defaultValue={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
        >
          <SelectTrigger className="w-[4.5rem] h-7">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions?.map((o) => (
              <SelectItem key={o} value={o.toString()}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Center Actions */}
      <div className="flex gap-1 items-center">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 hidden sm:inline-flex"
          disabled={!isCountLoading && currentPage <= 1}
          onClick={() => setPage(1)}
        >
          <ChevronFirst className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={!isCountLoading && currentPage <= 1}
          onClick={() => setPage(currentPage - 1)}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <div className="flex flex-row space-x-1 items-center">
          {isCountLoading ? (
            <p className="text-muted-foreground font-medium">Loading...</p>
          ) : count > 0 ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                className="w-12 h-7 text-xs"
                value={page}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (value < 1) {
                    setPage(1);
                  } else if (value > totalPages) {
                    setPage(totalPages);
                  } else {
                    setPage(value);
                  }
                }}
                min={1}
                max={totalPages}
              />
              <p className="text-muted-foreground font-medium whitespace-nowrap">
                of {totalPages}
              </p>
              {showCount && (
                <p className="text-muted-foreground font-medium text-[10px]">{`(${count} total)`}</p>
              )}
            </div>
          ) : (
            <></>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={!isCountLoading && currentPage >= totalPages}
          onClick={() => setPage(currentPage + 1)}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 hidden sm:inline-flex"
          disabled={!isCountLoading && currentPage >= totalPages}
          onClick={() => setPage(totalPages)}
        >
          <ChevronLast className="h-3 w-3" />
        </Button>
      </div>

      {/* Right Actions (empty) */}
      <div className="w-[107px]" />
    </footer>
  );
}
