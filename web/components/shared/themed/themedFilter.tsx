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
import { clsx } from "../clsx";
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { CSVLink } from "react-csv";
import useNotification from "../notification/useNotification";
import ThemedTimeFilter from "./themedTimeFilter";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { getRequests } from "../../../services/lib/requests";

const sortOptions = [
  { name: "Most Popular", href: "#", current: true },
  { name: "Best Rating", href: "#", current: false },
  { name: "Newest", href: "#", current: false },
];

interface ThemedFilterProps {
  data: any[];
  isFetching: boolean;
  onTimeSelectHandler: (key: string, value: string) => void;
}

function escapeCSVString(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }
  return s.replace(/"/g, '""');
}

export default function ThemedFilter(props: ThemedFilterProps) {
  const { data, onTimeSelectHandler, isFetching } = props;

  const timeFilterOptions = [
    { key: "day", value: "day" },
    { key: "wk", value: "wk" },
    { key: "mo", value: "mo" },
    // { key: "3mo", value: "3mo" },
  ];

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
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-0 justify-between sm:items-center pb-3">
              <ThemedTimeFilter
                timeFilterOptions={timeFilterOptions}
                isFetching={isFetching}
                onSelect={(key, value) => onTimeSelectHandler(key, value)}
                defaultValue="day"
                custom
              />
              {/* TODO: Add back this uncommented code once filters is functional */}
              {/* <div className="flex flex-row space-x-2 divide-x-2 divide-gray-200 items-center pr-2"> */}
              <div className="flex flex-row items-center">
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
                <div className="pl-0 sm:pl-2">
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
                      {/* <Transition
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
                                  <Link
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
                                  </Link>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                        </Menu.Items>
                      </Transition> */}
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
