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
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
  const { columns, activeColumns, setActiveColumns } = props;

  const categories = columns.reduce(
    (acc, column) => {
      const category = column.columnDef.meta?.category;
      if (category && !acc.includes(category)) {
        acc.push(category);
      }
      return acc;
    },
    ["All columns", "Default"] as string[],
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
                className="flex h-9 w-9 shrink-0 items-center justify-center text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <LuColumns3 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Manage columns</TooltipContent>
        </Tooltip>
        <DropdownMenuContent
          className="h-[66vh] w-[calc(100vw-2rem)] max-w-4xl overflow-hidden rounded-lg border border-slate-300 bg-white p-0 shadow-xl dark:border-slate-700 dark:bg-black sm:w-[calc(100vw-4rem)] md:w-[calc(100vw-8rem)]"
          align="center"
          sideOffset={8}
        >
          <DndProvider backend={HTML5Backend}>
            <Row className="h-full">
              <Col className="relative h-full flex-1 p-4">
                <div className="mb-4 flex flex-row items-center justify-start space-x-2">
                  <h3 className="text-xs font-medium text-foreground">
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
                  <span className="font-bold">Back to preset</span> on the
                  bottom left of the right panel
                </i>

                <div className="h-[calc(100%-6rem)] overflow-y-auto">
                  <DragList items={activeColumns} setItems={setActiveColumns} />
                </div>
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent dark:from-black"></div>
              </Col>
              <Separator
                className="dark:border-slate-800"
                orientation="vertical"
              />
              <Col className="flex h-full flex-1 flex-col">
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
                  <Row className="flex items-center justify-between gap-2">
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
                            })),
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
                            activeColumns.map((c) => ({ ...c, shown: true })),
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
          </DndProvider>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
