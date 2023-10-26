import { Menu, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  ArrowDownTrayIcon,
  CheckIcon,
  ChevronDoubleDownIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

interface ViewButtonProps {
  currentView: "table" | "card";
  onViewChange: (value: "table" | "card") => void;
}

export default function ViewButton(props: ViewButtonProps) {
  const { currentView, onViewChange } = props;

  const onViewChangeHandler = (value: "table" | "card") => {
    onViewChange(value);
  };

  return (
    <div className="text-right">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white hover:bg-sky-50 flex flex-row items-center gap-2">
            <Square3Stack3DIcon className="h-5 w-5 text-gray-900" />
            <p className="text-sm font-medium text-gray-900 hidden sm:block">
              View
            </p>
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
          <Menu.Items className="absolute right-0 mt-2 w-40 z-10 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1 ">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? "bg-sky-100 text-gray-900" : "text-gray-900"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    onClick={() => {
                      onViewChangeHandler("table");
                    }}
                  >
                    <div className="flex w-full items-center">
                      <TableCellsIcon className="mr-2 h-5 w-5" />
                      Table
                    </div>

                    {currentView === "table" && (
                      <CheckIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? "bg-sky-100 text-gray-900" : "text-gray-900"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    onClick={() => {
                      onViewChangeHandler("card");
                    }}
                  >
                    <div className="flex w-full items-center">
                      <Squares2X2Icon className="mr-2 h-5 w-5" />
                      Card
                    </div>
                    {currentView === "card" && (
                      <CheckIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
