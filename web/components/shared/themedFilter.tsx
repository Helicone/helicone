/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { Fragment, useState } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { clsx } from "./clsx";
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { CSVLink } from "react-csv";
import useNotification from "./notification/useNotification";

const timeFilterOptions = [
  { value: "day", label: "day" },
  { value: "wk", label: "wk" },
  { value: "mo", label: "mo" },
  { value: "3mo", label: "3mo" },
];

const sortOptions = [
  { name: "Most Popular", href: "#", current: true },
  { name: "Best Rating", href: "#", current: false },
  { name: "Newest", href: "#", current: false },
];

interface ThemedFilterProps {
  data: any[];
}

function escapeCSVString(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  return s.replace(/"/g, '""');
}

export default function ThemedFilter(props: ThemedFilterProps) {
  const { data } = props;
  const router = useRouter();
  const { setNotification } = useNotification();

  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();

  return (
    <div className="">
      {/* Filters */}
      <Disclosure
        as="section"
        aria-labelledby="filter-heading"
        className="grid items-center"
      >
        {({ open }) => (
          <>
            <h2 id="filter-heading" className="sr-only">
              Filters
            </h2>
            <div className="flex flex-row justify-between items-center pb-3">
              <span className="isolate inline-flex rounded-md shadow-sm z-10">
                <Menu as="div" className="relative inline-block text-left">
                  <div>
                    <Menu.Button
                      className={clsx(
                        router.query.time?.includes("custom:")
                          ? "bg-sky-200 text-black border-sky-300"
                          : "bg-white text-gray-500 hover:bg-sky-50 border-gray-300",
                        "relative inline-flex items-center rounded-l-md border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      )}
                    >
                      <CalendarDaysIcon className="h-5 mr-2" />
                      Custom
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
                    <Menu.Items className="absolute left-0 mt-2 w-fit -ml-2 px-1.5 py-3 origin-top-right rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 flex flex-col space-y-4">
                        <div className="flex flex-row gap-4">
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
                              router.replace({
                                query: {
                                  ...router.query,
                                  time: `custom:${start.toISOString()}_${end.toISOString()}`,
                                },
                              });
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>

                {timeFilterOptions.map((option, idx) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      router.replace({
                        query: {
                          ...router.query,
                          time: option.value,
                        },
                      });
                    }}
                    className={clsx(
                      router.query.time === option.value
                        ? "bg-sky-200 text-black border-sky-300"
                        : "bg-white text-gray-500 hover:bg-sky-50 border-gray-300",
                      idx === timeFilterOptions.length - 1
                        ? "rounded-r-md"
                        : "",
                      "relative -ml-px inline-flex items-center border px-3 py-1.5 text-sm font-medium focus:z-10 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </span>
              {/* TODO: Add back this uncommented code once filters is functional */}
              {/* <div className="flex flex-row space-x-2 divide-x-2 divide-gray-200 items-center pr-2"> */}
              <div className="flex flex-row items-center pr-2">
                {/* <div className="text-sm">
                  <div className="mx-auto flex">
                    <div>
                      <Disclosure.Button
                        className={clsx(
                          open
                            ? "bg-sky-100 text-sky-900"
                            : "hover:bg-sky-100 hover:text-sky-900",
                          "group flex items-center font-medium text-black px-4 py-2 rounded-lg"
                        )}
                      >
                        <FunnelIcon
                          className={clsx(
                            open
                              ? "bg-sky-100 text-sky-900"
                              : "hover:bg-sky-100 hover:text-sky-900",
                            "mr-2 h-5 flex-none"
                          )}
                          aria-hidden="true"
                        />
                        <p className="text-sm">
                          {open ? "Hide Filters" : "Show Filters"}
                        </p>
                      </Disclosure.Button>
                    </div>
                  </div>
                </div> */}
                <div className="pl-2">
                  <div className="mx-auto flex">
                    <Menu as="div" className="relative inline-block">
                      <CSVLink
                        data={data.map((d) => ({
                          ...d,
                          request: escapeCSVString(d.request),
                          response: escapeCSVString(d.response),
                        }))}
                        filename={"requests.csv"}
                        className="flex"
                        target="_blank"
                      >
                        <button className="group inline-flex items-center justify-center text-sm font-medium text-black hover:bg-sky-100 hover:text-sky-900 px-4 py-2 rounded-lg">
                          <ArrowDownTrayIcon
                            className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                            aria-hidden="true"
                          />
                          Export
                        </button>
                      </CSVLink>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            {sortOptions.map((option) => (
                              <Menu.Item key={option.name}>
                                {({ active }) => (
                                  <a
                                    href={option.href}
                                    className={clsx(
                                      option.current
                                        ? "font-medium text-gray-900"
                                        : "text-gray-500",
                                      active ? "bg-gray-100" : "",
                                      "block px-4 py-2 text-sm"
                                    )}
                                  >
                                    {option.name}
                                  </a>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="border border-gray-300 border-dashed bg-white rounded-lg px-4 py-2 mt-2 mb-4 shadow-sm">
              <p className="text-sm">Filters</p>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}
