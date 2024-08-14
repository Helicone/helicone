import { Menu, Transition } from "@headlessui/react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
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
    ["all", "Default"] as string[]
  );

  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined | "all"
  >(categories[0]);

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
          <div className="text-sm font-medium items-center text-gray-900 dark:text-gray-100 hidden sm:flex gap-1">
            Columns
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
        <Menu.Items className="border border-gray-300 dark:border-gray-700 absolute z-10 right-0 mt-2 w-[800px] origin-top-right rounded-lg bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Row className="p-4  gap-4">
            <Col className="relative flex-1 max-h-[calc(100vh-500px)]  divide-y space-y-2 divide-gray-200">
              <h3 className="text-xs text-black dark:text-white font-medium">
                Columns (Drag to reorder)
              </h3>
              <div className="overflow-y-auto h-full">
                <DragList items={activeColumns} setItems={setActiveColumns} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none"></div>
            </Col>
            <Col className="space-y-2 divide-y divide-gray-200 flex-1">
              <ColumnOptions
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                columns={columns}
                activeColumns={activeColumns}
                setActiveColumns={setActiveColumns}
              />
              <Row className="flex justify-between items-center pt-2 gap-2">
                <button
                  onClick={() =>
                    setActiveColumns(columnDefsToDragColumnItems(columns))
                  }
                  className="text-xs flex items-center justify-center gap-x-2.5 px-2 py-1 font-medium text-gray-500 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
                >
                  Reset
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
            </Col>
          </Row>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
