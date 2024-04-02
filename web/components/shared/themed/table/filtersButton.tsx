import { Menu, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import {
  ArrowPathIcon,
  CheckIcon,
  Square2StackIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { OrganizationFilter } from "../../../../services/lib/organization_layout/organization_layout";
import { clsx } from "../../clsx";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { set } from "date-fns";
import ThemedModal from "../themedModal";
import { useOrg } from "../../../layout/organizationContext";
import useNotification from "../../notification/useNotification";
import useSearchParams from "../../utils/useSearchParams";

interface FilterButtonProps {
  filters?: OrganizationFilter[];
  currentFilter?: string;
  onFilterChange?: (value: OrganizationFilter | null) => void;
  onDeleteCallback?: () => void;
}

export default function FiltersButton({
  filters,
  currentFilter,
  onFilterChange,
  onDeleteCallback,
}: FilterButtonProps) {
  const searchParams = useSearchParams();

  const [selectedFilter, setSelectedFilter] =
    useState<OrganizationFilter | null>(
      filters?.find((filter) => filter.id === currentFilter) ?? null
    );

  const [filterToDelete, setFilterToDelete] =
    useState<OrganizationFilter | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setNotification } = useNotification();
  const orgContext = useOrg();

  return (
    <>
      <div className="hidden md:block text-right">
        <Menu as="div" className="relative inline-block text-left">
          <div className="flex items-center gap-1">
            <Menu.Button
              className={clsx(
                selectedFilter !== null
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
                {selectedFilter !== null ? (
                  <>
                    <span className="">Filter:</span>
                    <span className="pl-1 text-sky-500">
                      {selectedFilter.name}
                    </span>
                  </>
                ) : (
                  "Saved Filters"
                )}
              </div>
            </Menu.Button>
            {selectedFilter !== null && (
              <button
                onClick={() => {
                  if (onFilterChange) {
                    setSelectedFilter(null);
                    onFilterChange(null);
                    searchParams.delete("filter");
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
            <Menu.Items className="absolute right-0 mt-2 w-60 z-10 origin-top-right divide-y divide-gray-100 dark:divide-gray-900 rounded-md bg-white border border-gray-300 dark:border-gray-700 dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-1 py-1">
                {filters && filters.length > 0 ? (
                  filters.map((filter, idx) => (
                    <Menu.Item key={idx}>
                      {({ active }) => (
                        <div
                          className={clsx(
                            active ? "bg-sky-100 dark:bg-sky-900" : "",
                            filter.id === currentFilter
                              ? "bg-sky-50 dark:bg-sky-950"
                              : "",
                            "flex justify-between items-center p-2"
                          )}
                        >
                          <button
                            className="group flex w-full items-center rounded-md text-sm text-gray-900 dark:text-gray-100"
                            onClick={() => {
                              if (onFilterChange) {
                                setSelectedFilter(filter);
                                onFilterChange(filter);
                              }
                            }}
                          >
                            <p className="w-44 truncate text-left">
                              {filter.name}
                            </p>
                          </button>
                          <button
                            onClick={() => {
                              setFilterToDelete(filter);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
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
      <ThemedModal open={isDeleteModalOpen} setOpen={setIsDeleteModalOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            Delete Saved Filter: {filterToDelete?.name}
          </p>
          <p className="text-gray-500 w-[400px] whitespace-pre-wrap text-sm">
            This filter will be delete from your organization. Are you sure you
            want to delete this filter?
          </p>
          <div className="w-full flex justify-end gap-4 mt-4">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
              }}
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setIsLoading(true);
                const updatedFilters = filters?.filter(
                  (filter) => filter.id !== filterToDelete?.id
                );
                await fetch(
                  `/api/organization/${orgContext?.currentOrg
                    ?.id!}/update_filter`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      type: "dashboard",
                      filters: updatedFilters,
                    }),
                  }
                )
                  .then(() => {
                    setIsLoading(false);
                    setIsDeleteModalOpen(false);
                    setNotification("Filter deleted successfully", "success");
                    onDeleteCallback && onDeleteCallback();
                  })
                  .catch(() => {
                    setIsLoading(false);
                    setNotification("Error deleting filter", "error");
                  });
              }}
              className={clsx(
                "relative inline-flex items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
              )}
            >
              {isLoading && (
                <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
              )}
              Delete
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
}
