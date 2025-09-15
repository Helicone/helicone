import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { clsx } from "@/components/shared/clsx";
import { Input } from "@/components/ui/input";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
  totalRows: number;
  startRow: number;
  endRow: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rows: number) => void;
  isBottom?: boolean;
}

export const PaginationControls = ({
  currentPage,
  totalPages,
  rowsPerPage,
  totalRows,
  startRow,
  endRow,
  onPageChange,
  onRowsPerPageChange,
  isBottom = false,
}: PaginationControlsProps) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageDraft, setPageDraft] = useState<string>(String(currentPage));

  useEffect(() => {
    if (!isEditingPage) {
      setPageDraft(String(currentPage));
    }
  }, [currentPage, isEditingPage]);

  const commitPage = () => {
    const parsed = parseInt(pageDraft, 10);
    if (Number.isNaN(parsed)) {
      setIsEditingPage(false);
      setPageDraft(String(currentPage));
      return;
    }
    const clamped = Math.max(1, Math.min(totalPages, parsed));
    setIsEditingPage(false);
    setPageDraft(String(clamped));
    if (clamped !== currentPage) {
      onPageChange?.(clamped);
    }
  };

  return (
    <div
      className={clsx(
        "flex items-center justify-between border-tremor-brand-subtle bg-background px-4 py-2",
        isBottom ? "border-t" : "border-b",
      )}
    >
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground">
          Showing {startRow} to {endRow} of {totalRows} rows
        </span>

        <Select
          value={rowsPerPage.toString()}
          onValueChange={(value) => onRowsPerPageChange?.(parseInt(value))}
        >
          <SelectTrigger className="h-8 w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25 rows</SelectItem>
            <SelectItem value="50">50 rows</SelectItem>
            <SelectItem value="100">100 rows</SelectItem>
            <SelectItem value="200">200 rows</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange?.(1)}
          disabled={!canGoPrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={!canGoPrevious}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Page</span>
          {isEditingPage ? (
            <Input
              autoFocus
              value={pageDraft}
              onChange={(e) => setPageDraft(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={commitPage}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPage();
                if (e.key === "Escape") {
                  setIsEditingPage(false);
                  setPageDraft(String(currentPage));
                }
              }}
              className="h-7 w-14 px-2 py-1 text-center"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingPage(true)}
              className="rounded px-1 py-0.5 text-foreground/80 underline-offset-2 hover:underline"
              aria-label="Edit page number"
            >
              {currentPage}
            </button>
          )}
          <span>of {totalPages}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange?.(totalPages)}
          disabled={!canGoNext}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};


