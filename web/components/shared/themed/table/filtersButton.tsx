import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { CheckIcon, Square2StackIcon } from "@heroicons/react/24/outline";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import { clsx } from "../../clsx";
import { XCircleIcon } from "@heroicons/react/24/solid";

interface FilterButtonProps {
  filters?: OrganizationFilter[];
  currentFilter?: string;
  onFilterChange?: (value: OrganizationFilter | null) => void;
}

export default function FiltersButton({
  filters,
  currentFilter,
  onFilterChange,
}: FilterButtonProps) {
  const [currentFilterName, setCurrentFilterName] = useState<string>("");
  return (
    <div className="hidden md:block text-right">
      <Menu as="div" className="relative inline-block text-left">
        <div className="flex items-center gap-1">
          <Menu.Button
            className={clsx(
              currentFilterName !== ""
                ? "bg-sky-50 dark:bg-sky-900"
                : "bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900",
              "border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 flex flex-row items-center gap-2"
            )}
          >
            <Square2StackIcon
              className="h-5 w-5 text-gray-900 dark:text-gray-100"
              aria-hidden="true"
            />
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:flex items-center">
              {currentFilterName !== "" ? (
                <>
                  <span className="">Filter:</span>
                  <span className="pl-1 text-sky-500">{currentFilterName}</span>
                </>
              ) : (
                "Saved Filters"
              )}
            </div>
          </Menu.Button>
          {currentFilterName !== "" && (
            <button
              onClick={() => {
                if (onFilterChange) {
                  setCurrentFilterName("");
                  onFilterChange(null);
                }
              }}
              className="pl-1 text-gray-500"
            >
              Clear
            </button>
          )}
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
          <Menu.Items className="absolute right-0 mt-2 w-56 z-10 origin-top-right divide-y divide-gray-100 dark:divide-gray-900 rounded-md bg-white border border-gray-300 dark:border-gray-700 dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1">
              {filters && filters.length > 0 ? (
                filters.map((filter, idx) => (
                  <Menu.Item key={idx}>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? "bg-sky-100 dark:bg-sky-900" : ""
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                        onClick={() => {
                          if (onFilterChange) {
                            setCurrentFilterName(filter.name);
                            onFilterChange(filter);
                          }
                        }}
                      >
                        {filter.name}
                        {currentFilter && currentFilter === filter.id && (
                          <CheckIcon className="ml-auto h-4 w-4" />
                        )}
                      </button>
                    )}
                  </Menu.Item>
                ))
              ) : (
                <Menu.Item key={"no-filters"}>
                  {({ active }) => (
                    <div
                      className={`${
                        active ? "bg-sky-100 dark:bg-sky-900" : ""
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                    >
                      No filters
                    </div>
                  )}
                </Menu.Item>
              )}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
