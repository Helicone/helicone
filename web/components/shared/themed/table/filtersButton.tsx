import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";

interface FilterButtonProps {
  filters?: OrganizationFilter[];
  currentFilter?: OrganizationFilter;
  onFilterChange?: (value: OrganizationFilter) => void;
}

export default function FiltersButton({
  filters,
  currentFilter,
  onFilterChange,
}: FilterButtonProps) {
  return (
    <div className="hidden md:block text-right">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
              Saved Filters
            </span>
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
          <Menu.Items className="absolute right-0 mt-2 w-56 z-10 origin-top-right divide-y divide-gray-100 dark:divide-gray-900 rounded-md bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1">
              {filters && filters.length > 0 ? (
                filters.map((filter) => (
                  <Menu.Item key={filter.name}>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? "bg-sky-100 dark:bg-sky-900" : ""
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                        onClick={() => onFilterChange && onFilterChange(filter)}
                      >
                        {filter.name}
                        {currentFilter &&
                          currentFilter.filter === filter.filter && (
                            <CheckIcon className="ml-auto h-5 w-5" />
                          )}
                      </button>
                    )}
                  </Menu.Item>
                ))
              ) : (
                <Menu.Item>
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
