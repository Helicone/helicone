import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  CheckIcon,
  Square2StackIcon,
  Square3Stack3DIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { RequestViews } from "./themedTableV5";

interface ViewButtonProps {
  currentView: RequestViews;
  onViewChange: (value: RequestViews) => void;
}

export default function ViewButton(props: ViewButtonProps) {
  const { currentView, onViewChange } = props;

  const onViewChangeHandler = (value: RequestViews) => {
    onViewChange(value);
  };

  return (
    <div className="hidden md:block text-right">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-black hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2">
            <Square3Stack3DIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
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
          <Menu.Items className="absolute right-0 mt-2 w-40 z-10 origin-top-right divide-y divide-gray-100 dark:divide-gray-900 rounded-md bg-white dark:bg-black shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1 ">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? "bg-sky-100 dark:bg-sky-900" : ""
                    } text-gray-900 dark:text-gray-100 group flex w-full items-center rounded-md px-2 py-2 text-sm`}
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
                      active ? "bg-sky-100 dark:bg-sky-900" : ""
                    } text-gray-900 dark:text-gray-100 group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    onClick={() => {
                      onViewChangeHandler("row");
                    }}
                  >
                    <div className="flex w-full items-center">
                      <Square2StackIcon className="mr-2 h-5 w-5" />
                      Row
                    </div>
                    {currentView === "row" && <CheckIcon className="h-5 w-5" />}
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${
                      active ? "bg-sky-100 dark:bg-sky-900" : ""
                    } text-gray-900 dark:text-gray-100 group flex w-full items-center rounded-md px-2 py-2 text-sm`}
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
