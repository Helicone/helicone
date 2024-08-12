import { Menu, Transition } from "@headlessui/react";
import {
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
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
import { Divider } from "@mui/material";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";

interface ViewColumnsProps<T> {
  columns: Column<T, unknown>[];
  activeColumns: DragColumnItem[];
  setActiveColumns: (columns: DragColumnItem[]) => void;
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
    ["All columns", "Default"] as string[]
  );

  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined | "All columns"
  >(categories[0]);

  const BlackTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.common.black,
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
      fontSize: "0.8rem",
    },
  }));

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <div className="text-sm font-medium items-center text-gray-900 dark:text-gray-100 hidden sm:flex gap-1">
            Reorder columns
            <span className="text-gray-500 text-xs">{`( ${
              activeColumns.filter((c) => c.shown).length
            } / ${columns.length} )`}</span>
          </div>
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
        <Menu.Items className="border border-gray-300 dark:border-gray-700 absolute z-10 right-0 mt-2 mx-auto w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] md:w-[calc(100vw-8rem)] max-w-4xl origin-top-right rounded-lg bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none h-[66vh] overflow-hidden">
          <Row className="h-full">
            <Col className="relative flex-1 h-full p-4">
              <div className="flex flex-row items-center justify-start space-x-2 mb-4">
                <h3 className="text-xs text-black dark:text-white font-medium">
                  Column Reorder
                </h3>
                <BlackTooltip
                  title="The ordering only affects your Requests table"
                  placement="top"
                  arrow
                >
                  <InformationCircleIcon className="h-5 w-5 text-gray-500 inline" />
                </BlackTooltip>
              </div>

              <div className="overflow-y-auto h-[calc(100%-6rem)]">
                <DragList items={activeColumns} setItems={setActiveColumns} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none"></div>
            </Col>
            <Divider orientation="vertical" flexItem />
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
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <Row className="flex justify-between items-center gap-2">
                  <button
                    onClick={() =>
                      setActiveColumns(columnDefsToDragColumnItems(columns))
                    }
                    className="text-xs flex items-center justify-center gap-x-2.5 px-2 py-1 font-medium text-gray-500 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
                  >
                    Back to preset
                  </button>
                  <Row>
                    <button
                      onClick={() =>
                        setActiveColumns(
                          activeColumns.map((c) => ({ ...c, shown: false }))
                        )
                      }
                      className="text-xs flex items-center justify-center gap-x-2.5 px-2 py-1 font-medium text-gray-500 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
                    >
                      Deselect All
                    </button>
                    <button
                      onClick={() =>
                        setActiveColumns(
                          activeColumns.map((c) => ({ ...c, shown: true }))
                        )
                      }
                      className="text-xs flex items-center justify-center gap-x-2.5 px-2 py-1 font-medium text-gray-500 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
                    >
                      Select All
                    </button>
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
