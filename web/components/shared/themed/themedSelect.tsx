import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { clsx } from "../clsx";

interface ThemedSelectProps {
  options: string[];
  onOptionSelect: (option: string) => void;
}

export default function ThemedSelect(props: ThemedSelectProps) {
  const { options, onOptionSelect } = props;
  const [selected, setSelected] = useState<string>(options[0]);

  return (
    <Listbox value={selected} onChange={setSelected}>
      {({ open }) => (
        <>
          <div className="relative">
            <div className="inline-flex divide-x divide-sky-300 rounded-md border border-sky-300">
              <div className="inline-flex items-center gap-x-1.5 rounded-l-md px-3 py-1.5 bg-sky-200 text-black border-sky-300">
                <p className="text-sm font-medium">{selected}</p>
              </div>
              <Listbox.Button className="inline-flex items-center rounded-l-none rounded-r-md px-1 focus:outline-none bg-sky-200 text-black border-sky-300">
                <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
              </Listbox.Button>
            </div>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute right-0 z-10 mt-2 w-full origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {options.map((option, idx) => (
                  <Listbox.Option
                    key={idx}
                    className={({ active }) =>
                      clsx(
                        active ? "bg-sky-600 text-white" : "text-gray-900",
                        "cursor-default select-none p-4 text-sm"
                      )
                    }
                    value={option}
                    onClick={() => onOptionSelect(option)}
                  >
                    {({ selected, active }) => (
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <p
                            className={selected ? "font-medium" : "font-normal"}
                          >
                            {option}
                          </p>
                          {selected ? (
                            <span
                              className={active ? "text-white" : "text-sky-600"}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
