import { Menu, Transition } from "@headlessui/react";
import {
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Column } from "@tanstack/react-table";
import { Fragment, useState } from "react";
import { Col } from "../../../../layout/common/col";
import { Row } from "../../../../layout/common/row";
import ColumnOptions from "./ColumnOptions";
import {
  columnDefsToDragColumnItems,
  DragColumnItem,
  DragList,
} from "./DragList";
import { Button } from "@/components/ui/button";

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

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button
          as={Button}
          variant="ghost"
          className="flex items-center gap-2 text-slate-700 dark:text-slate-400"
          size="xs"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
        </Menu.Button>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="border border-slate-300 dark:border-slate-700 absolute z-20 right-0 sm:right-0 mt-2 mx-auto w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] md:w-[calc(100vw-8rem)] max-w-4xl origin-top-right rounded-lg bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none h-[66vh] overflow-hidden">
          <Row className="h-full">
            <Col className="relative flex-1 h-full p-4">
              <div className="flex flex-row items-center justify-start space-x-2 mb-4">
                <h3 className="text-xs text-foreground font-medium">
                  Column Reorder
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InformationCircleIcon className="h-5 w-5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The ordering only affects your Requests table</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                    onClick={() =>
                      setActiveColumns(columnDefsToDragColumnItems(columns))
                    }
                    className="text-xs"
                  >
                    Back to preset
                  </Button>
                  <Row>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveColumns(
                          activeColumns.map((c) => ({ ...c, shown: false }))
                        )
                      }
                      className="text-xs"
                    >
                      Deselect All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setActiveColumns(
                          activeColumns.map((c) => ({ ...c, shown: true }))
                        )
                      }
                      className="text-xs"
                    >
                      Select All
                    </Button>
                  </Row>
                </Row>
              </div>
            </Col>
          </Row>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
