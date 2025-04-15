import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Column } from "@tanstack/react-table";
import { useState } from "react";
import { LuColumns3, LuInfo } from "react-icons/lu";
import { Col } from "../../../../layout/common/col";
import { Row } from "../../../../layout/common/row";
import ColumnOptions from "./ColumnOptions";
import {
  columnDefsToDragColumnItems,
  DragColumnItem,
  DragList,
} from "./DragList";

interface ViewColumnsProps<T> {
  columns: Column<T, unknown>[];
  activeColumns: DragColumnItem[];
  setActiveColumns: (columns: DragColumnItem[]) => void;
  isDatasetsPage?: boolean;
}

export default function ViewColumns<T>(props: ViewColumnsProps<T>) {
  const { columns, activeColumns, setActiveColumns, isDatasetsPage } = props;

  const categories = columns.reduce(
    (acc, column) => {
      const category = column.columnDef.meta?.category;
      if (category && !acc.includes(category)) {
        acc.push(category);
      }
      return acc;
    },
    ["All columns", "Default"] as string[]
  );

  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined | "All columns"
  >(categories[0]);

  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="none"
                size="none"
                className="h-9 w-9 shrink-0 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <LuColumns3 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Manage columns</TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          className="border border-slate-300 dark:border-slate-700 w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] md:w-[calc(100vw-8rem)] max-w-4xl rounded-lg bg-white dark:bg-black shadow-xl h-[66vh] overflow-hidden p-0"
          align="center"
          sideOffset={8}
        >
          <Row className="h-full">
            <Col className="relative flex-1 h-full p-4">
              <div className="flex flex-row items-center justify-start space-x-2 mb-4">
                <h3 className="text-xs text-foreground font-medium">
                  Column Reorder
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="cursor-default"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LuInfo className="h-5 w-5 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>The ordering only affects your Requests table</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <i className="text-xs text-slate-500">
                Note: If something is not shown, or your columns are in an
                unexpected state, please click{" "}
                <span className="font-bold">Back to preset</span> on the bottom
                left of the right panel
              </i>

              <div className="overflow-y-auto h-[calc(100%-6rem)]">
                <DragList items={activeColumns} setItems={setActiveColumns} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none"></div>
            </Col>
            <Separator
              className="dark:border-slate-800"
              orientation="vertical"
            />
            <Col className="flex-1 flex flex-col h-full">
              <div className="flex-grow overflow-hidden p-4">
                <ColumnOptions
                  categories={categories}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  columns={columns}
                  activeColumns={activeColumns}
                  setActiveColumns={setActiveColumns}
                />
              </div>
              <div className="border-t border-border p-4">
                <Row className="flex justify-between items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveColumns(columnDefsToDragColumnItems(columns));
                    }}
                    className="text-xs"
                  >
                    Back to preset
                  </Button>
                  <Row>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveColumns(
                          activeColumns.map((c) => ({
                            ...c,
                            shown: false,
                          }))
                        );
                      }}
                      className="text-xs"
                    >
                      Deselect All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveColumns(
                          activeColumns.map((c) => ({ ...c, shown: true }))
                        );
                      }}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                  </Row>
                </Row>
              </div>
            </Col>
          </Row>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
