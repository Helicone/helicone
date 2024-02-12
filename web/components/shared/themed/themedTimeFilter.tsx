import { Menu, Popover, Transition } from "@headlessui/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";
import { clsx } from "../clsx";
import useNotification from "../notification/useNotification";
import useSearchParams from "../utils/useSearchParams";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import { TimeFilter } from "../../templates/dashboard/dashboardPage";

interface ThemedTimeFilterProps {
  timeFilterOptions: { key: string; value: string }[];
  onSelect: (key: string, value: string) => void;
  isFetching: boolean;
  defaultValue: string;
  currentTimeFilter: TimeFilter;
  custom?: boolean;
}

function formatDateToInputString(date: Date): string {
  if (!date) {
    return "";
  }
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-11 in JavaScript
  const DD = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const MI = String(date.getMinutes()).padStart(2, "0");

  return `${YYYY}-${MM}-${DD}T${HH}:${MI}`;
}

const ThemedTimeFilter = (props: ThemedTimeFilterProps) => {
  const {
    timeFilterOptions,
    onSelect,
    defaultValue,
    isFetching,
    currentTimeFilter,
    custom = false,
  } = props;
  const { setNotification } = useNotification();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string>(defaultValue);

  const [startDate, setStartDate] = useState<string | undefined>(
    formatDateToInputString(currentTimeFilter?.start) || undefined
  );
  const [endDate, setEndDate] = useState<string | undefined>(
    formatDateToInputString(currentTimeFilter?.end) || undefined
  );

  const isActive = (key: string) => {
    return active === key;
  };

  const [relative, setRelative] = useState<
    "minute" | "hour" | "day" | "week" | "month"
  >("day");
  const [relativeValue, setRelativeValue] = useState<number>(1);

  useEffect(() => {
    if (relative && relativeValue) {
      let startDate = new Date().getTime();

      if (relative === "minute") {
        startDate -= relativeValue * 60 * 1000;
      } else if (relative === "hour") {
        startDate -= relativeValue * 60 * 60 * 1000;
      } else if (relative === "day") {
        startDate -= relativeValue * 24 * 60 * 60 * 1000;
      } else if (relative === "week") {
        startDate -= relativeValue * 7 * 24 * 60 * 60 * 1000;
      } else if (relative === "month") {
        startDate -= relativeValue * 30 * 24 * 60 * 60 * 1000;
      }

      setStartDate(formatDateToInputString(new Date(startDate)));
      setEndDate(
        formatDateToInputString(new Date(new Date().getTime() + 1000))
      );
    }
  }, [relative, relativeValue]);

  return (
    <Menu
      as="div"
      className="relative inline-flex text-left z-10 shadow-sm h-fit w-fit isolate rounded-lg"
    >
      {custom && (
        <>
          <Popover className="relative">
            <Popover.Button
              disabled={isFetching}
              className={clsx(
                isActive("custom")
                  ? "bg-sky-200 border-sky-300 dark:bg-sky-800 dark:border-sky-700"
                  : "bg-white hover:bg-sky-50 border-gray-300 dark:bg-black dark:hover:bg-sky-900 dark:border-gray-700",
                "relative inline-flex text-gray-900 dark:text-gray-100 items-center rounded-l-lg border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              )}
            >
              <CalendarDaysIcon className="h-5 mr-2" />
              Custom
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Popover.Panel className="mt-3 absolute z-10 bg-white dark:bg-black rounded-lg shadow-2xl p-2 border border-gray-300 dark:border-gray-700">
                {({ close }) => (
                  <div className="px-4 py-2 flex flex-col space-y-4">
                    <TabGroup>
                      <TabList className="font-semibold" variant="line">
                        <Tab>Absolute</Tab>
                        <Tab>Relative</Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div>
                              <label
                                htmlFor="startDate"
                                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Start Date
                              </label>
                              <div className="mt-1">
                                <input
                                  type="datetime-local"
                                  name="startDate"
                                  id="startDate"
                                  onChange={(e) => {
                                    setStartDate(e.target.value);
                                    console.log(e.target.value);
                                  }}
                                  value={startDate}
                                  className="bg-gray-50 dark:bg-gray-900 text-black dark:text-white block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="endDate"
                                className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                End Date
                              </label>
                              <div className="mt-1">
                                <input
                                  type="datetime-local"
                                  name="endDate"
                                  id="endDate"
                                  onChange={(e) => {
                                    setEndDate(e.target.value);
                                  }}
                                  value={endDate}
                                  className="bg-gray-50 dark:bg-gray-900 text-black dark:text-white block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </TabPanel>
                        <TabPanel>
                          <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="mt-1">
                              <input
                                type="number"
                                name="relativeValue"
                                id="relativeValue"
                                onChange={(e) => {
                                  setRelativeValue(Number(e.target.value));
                                }}
                                value={relativeValue}
                                className="h-10 w-16 bg-gray-50 dark:bg-gray-900 text-black dark:text-white block rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              />
                            </div>

                            <select
                              id="relative"
                              name="relative"
                              value={relative}
                              onChange={(e) => {
                                setRelative(e.target.value as any);
                              }}
                              className="h-10 bg-gray-50 dark:bg-gray-900 text-black dark:text-white  rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                              <option value="minute">Minutes</option>
                              <option value="hour">Hours</option>
                              <option value="day">Days</option>
                              <option value="week">Weeks</option>
                              <option value="month">Months</option>
                            </select>
                          </div>
                        </TabPanel>
                      </TabPanels>
                    </TabGroup>

                    <div className="py-1 w-full flex flex-row gap-3 items-center justify-end">
                      <button
                        onClick={() => close()}
                        className="items-center rounded-md bg-white dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm flex font-semibold text-gray-900 dark:text-gray-100 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (!startDate || !endDate) {
                            setNotification(
                              "Please select a start and end date",
                              "error"
                            );
                            return;
                          }
                          if (endDate && startDate > endDate) {
                            setNotification(
                              "Start date must be before end date",
                              "error"
                            );

                            return;
                          }
                          if (startDate && startDate < startDate) {
                            setNotification(
                              "End date must be after start date",
                              "error"
                            );
                            return;
                          }
                          const start = new Date(startDate as string);
                          const end = new Date(endDate as string);
                          searchParams.set(
                            "t",
                            `custom_${start.toISOString()}_${end.toISOString()}`
                          );
                          setActive("custom");
                          onSelect(
                            "custom",
                            `${start.toISOString()}_${end.toISOString()}`
                          );
                          close();
                        }}
                        className="items-center rounded-md bg-black dark:bg-white px-3 py-1.5 text-sm flex font-semibold text-white dark:text-black dark:hover:bg-gray-200 shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </Popover.Panel>
            </Transition>
          </Popover>
        </>
      )}

      {timeFilterOptions.map((option, idx) => (
        <button
          key={option.key}
          type="button"
          disabled={isFetching}
          onClick={() => {
            searchParams.set("t", option.key);
            setActive(option.key);
            onSelect(option.key, option.value);
          }}
          className={clsx(
            "text-gray-900 dark:text-gray-100",
            isActive(option.key)
              ? "bg-sky-200 border-sky-300 border dark:bg-sky-800 dark:border-sky-700"
              : "bg-white hover:bg-sky-50 border-gray-300 dark:bg-black dark:hover:bg-sky-900 dark:border-gray-700",
            idx === timeFilterOptions.length - 1 ? "rounded-r-lg" : "",
            !custom && idx === 0
              ? "relative inline-flex items-center rounded-l-lg border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              : "relative -ml-px inline-flex items-center border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          )}
        >
          {option.value}
        </button>
      ))}
    </Menu>
  );
};

export default ThemedTimeFilter;
