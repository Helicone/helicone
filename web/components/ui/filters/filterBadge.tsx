import { Popover, Transition } from "@headlessui/react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

import { Fragment } from "react";

interface FilterBadgeProps {
  title: string;
  children?: React.ReactNode;
}

const FilterBadge = (props: FilterBadgeProps) => {
  const { title, children } = props;

  return (
    <div className="z-30">
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className="bg-white border border-gray-300 rounded-full flex flex-row items-center pl-1.5 pr-2 py-1 text-xs font-semibold gap-1">
              <PlusCircleIcon className="w-4 h-4 text-gray-500" />
              <span>{title}</span>
            </Popover.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel className="absolute -left-2 mt-2 w-56 origin-top-left rounded-lg py-2 px-3 bg-white shadow-lg border border-gray-300 flex flex-col space-y-3 text-gray-900 dark:text-gray-100">
                <p className="mt-1 font-semibold tracking-wide text-gray-700 text-sm">
                  Filter by {title.toLowerCase()}
                </p>
                {children}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
};

export default FilterBadge;
