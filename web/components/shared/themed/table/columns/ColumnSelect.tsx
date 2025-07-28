import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export type ColumnViewOptions = "All columns" | "Default" | "Custom properties";
interface ColumnSelectButtonProps {
  categories: string[];
  currentView: ColumnViewOptions;
  onViewChange: (value: ColumnViewOptions) => void;
}

export default function ColumnSelectButton(props: ColumnSelectButtonProps) {
  const { currentView, onViewChange, categories } = props;

  const onViewChangeHandler = (value: ColumnViewOptions) => {
    onViewChange(value);
  };

  return (
    <div className="-mt-2 text-left">
      <Menu as="div" className="relative inline-block text-right">
        <div>
          <Menu.Button className="flex flex-row items-center gap-2 rounded-lg bg-white py-1.5 dark:bg-black">
            <p className="hidden text-xs font-medium text-gray-900 dark:text-gray-100 sm:block">
              {currentView}
            </p>
            <ChevronDownIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
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
          <Menu.Items className="absolute left-0 z-10 mt-2 w-40 origin-top-left divide-y divide-gray-100 rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:divide-gray-900 dark:bg-black">
            <div className="px-1 py-1">
              {categories
                .filter((x) => x !== "Default")
                .map((category) => (
                  <Menu.Item key={category}>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? "bg-sky-100 dark:bg-sky-900" : ""
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                        onClick={() => {
                          onViewChangeHandler(category as ColumnViewOptions);
                        }}
                      >
                        <div className="flex w-full items-center">
                          {category}
                        </div>

                        {currentView === category && (
                          <CheckIcon className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </Menu.Item>
                ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
