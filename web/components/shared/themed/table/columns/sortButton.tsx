import { Menu, Transition } from "@headlessui/react";
import {
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  TrashIcon,
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
import { ThemedTextDropDown } from "../../themedTextDropDown";
import { useRouter } from "next/router";
import ThemedDropdown from "../../themedDropdown";
import { ThemedSwitch } from "../../themedSwitch";

interface SortButtonProps<T> {
  columns: Column<T, unknown>[];
  activeColumns: DragColumnItem[];
  setActiveColumns: (columns: DragColumnItem[]) => void;
}

export default function SortButton<T>(props: SortButtonProps<T>) {
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

  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined | "all"
  >(categories[0]);

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2">
          <BarsArrowDownIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />

          <div className="text-sm font-medium items-center text-gray-900 dark:text-gray-100 hidden sm:flex gap-1">
            Sort
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
        <Menu.Items className="border border-gray-300 dark:border-gray-700 absolute z-10 right-0 mt-2 origin-top-right rounded-lg bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Row className="p-4  gap-4">
            <button
              onClick={() => {
                const { sortDirection, sortKey, ...restQuery } = router.query;
                router.push({
                  pathname: router.pathname,
                  query: restQuery,
                });
              }}
            >
              <TrashIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
            </button>
            <ThemedDropdown
              options={columns
                .filter((column) => column.columnDef.meta?.sortKey)
                .map((column) => {
                  return {
                    label: column.columnDef.id ?? "",
                    value: column.columnDef.meta?.sortKey!,
                    sortKey: column.columnDef.meta?.sortKey!,
                  };
                })}
              onSelect={(option) => {
                router.push(
                  {
                    pathname: router.pathname,
                    query: { ...router.query, sortKey: option },
                  },
                  undefined
                );
              }}
              selectedValue={router.query.sortKey as string}
            />
            <ThemedSwitch
              checked={router.query.sortDirection === "asc"}
              onChange={(checked) => {
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
              OffIcon={BarsArrowDownIcon}
              OnIcon={BarsArrowUpIcon}
            />
          </Row>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
