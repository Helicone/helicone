import { Menu, Transition } from "@headlessui/react";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import { clsx } from "../clsx";
import useNotification from "../notification/useNotification";

interface ThemedTimeFilterProps {
  timeFilterOptions: { key: string; value: string }[];
  onSelect: (key: string, value: string) => void;
  isFetching: boolean;
  defaultValue: string;
  custom?: boolean;
}

const ThemedTimeFilter = (props: ThemedTimeFilterProps) => {
  const {
    timeFilterOptions,
    onSelect,
    defaultValue,
    isFetching,
    custom = false,
  } = props;
  const { setNotification } = useNotification();
  const [active, setActive] = useState<string>(defaultValue);

  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();

  const isActive = (key: string) => {
    return active === key;
  };

  return (
    <Menu
      as="div"
      className="relative inline-flex text-left z-10 shadow-sm isolate"
    >
      {custom && (
        <>
          <Menu.Button
            disabled={isFetching}
            className={clsx(
              isActive("custom")
                ? "bg-sky-200 text-black border-sky-300"
                : "bg-white text-gray-500 hover:bg-sky-50 border-gray-300",
              "relative inline-flex items-center rounded-l-md border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            )}
          >
            <CalendarDaysIcon className="h-5 mr-2" />
            Custom
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="z-20 absolute left-0 mt-10 w-fit px-1.5 py-3 origin-top-right rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-2 flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-xs font-medium text-gray-700"
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
                        }}
                        value={startDate}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-xs font-medium text-gray-700"
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
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-row justify-end gap-4">
                  <button
                    className="block w-max items-center justify-center text-sm font-medium text-gray-500 hover:text-black"
                    onClick={() => {}}
                  >
                    Cancel
                  </button>
                  <button
                    className="block w-max items-center justify-center rounded-md border border-transparent bg-sky-600 bg-origin-border px-2 py-1 text-sm font-medium text-white shadow-sm hover:bg-sky-700"
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
                      setActive("custom");
                      onSelect(
                        "custom",
                        `custom:${start.toISOString()}_${end.toISOString()}`
                      );
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}

      {timeFilterOptions.map((option, idx) => (
        <button
          key={option.key}
          type="button"
          disabled={isFetching}
          onClick={() => {
            setActive(option.key);
            onSelect(option.key, option.value);
          }}
          className={clsx(
            isActive(option.key)
              ? "bg-sky-200 text-black border-sky-300"
              : "bg-white text-gray-500 hover:bg-sky-50 border-gray-300",
            idx === timeFilterOptions.length - 1 ? "rounded-r-md" : "",
            !custom && idx === 0
              ? "relative inline-flex items-center rounded-l-md border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              : "relative -ml-px inline-flex items-center border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          )}
        >
          {option.value}
        </button>
      ))}
    </Menu>
  );
};

export default ThemedTimeFilter;
