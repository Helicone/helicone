import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { clsx } from "../clsx";
import { ViewfinderCircleIcon } from "@heroicons/react/24/outline";

interface ThemedSelectProps {
  options: string[];
  onOptionSelect: (option: string) => void;
}

export default function ThemedSelect(props: ThemedSelectProps) {
  const { options, onOptionSelect } = props;

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <div>
            <Menu.Button
              className={clsx(
                open
                  ? "bg-sky-100 text-sky-900"
                  : "hover:bg-sky-100 hover:text-sky-900",
                "group flex items-center font-medium text-black px-4 py-2 rounded-lg"
              )}
            >
              <ViewfinderCircleIcon
                className="mr-2 h-5 flex-none text-black hover:bg-sky-100 hover:text-sky-900"
                aria-hidden="true"
              />
              View
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
            <Menu.Items className="absolute right-0 z-10 mt-2 w-max origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                {options.map((option) => (
                  <Menu.Item key={option}>
                    {({ active }) => (
                      <button
                        onClick={() => onOptionSelect(option)}
                        className={clsx(
                          active
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-700",
                          "block w-full text-left px-4 py-2 text-sm"
                        )}
                      >
                        {option}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}
