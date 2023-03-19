import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { clsx } from "../clsx";
import { Column } from "../../ThemedTableV2";
import { TrashIcon } from "@heroicons/react/24/outline";

interface DropdownOption<T> {
  label: string;
  value: T;
}

interface ThemedDropdownProps<T> {
  options: DropdownOption<T>[];
  selectedValue: T;
  onSelect: (option: T) => void;

  className?: string;
  label?: string;
}

export default function ThemedDropdown<T>(props: ThemedDropdownProps<T>) {
  const { options, selectedValue, onSelect, className, label } = props;
  const selected = options.find((option) => option.value === selectedValue);

  return (
    <div className={className}>
      <Listbox value={selected?.value} onChange={onSelect}>
        {({ open }) => (
          <>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm">
                {label && (
                  <label
                    htmlFor="name"
                    className="absolute -top-2 sm:-top-2.5 left-2 inline-block bg-white px-0.5 text-[0.55rem] font-light text-gray-600"
                  >
                    {label}
                  </label>
                )}

                <span className="block truncate">
                  {selected?.label || "Select a column"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute right-0 z-30 mt-1.5 max-h-60 w-full min-w-[200px] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {options.map((option, i) => (
                    <Listbox.Option
                      key={i}
                      className={({ active }) =>
                        clsx(
                          active ? "text-white bg-sky-600" : "text-gray-900",
                          "relative cursor-default select-none py-2 pl-3 pr-9 hover:cursor-pointer"
                        )
                      }
                      value={option.value}
                    >
                      {({ selected, active }) => (
                        <>
                          <span
                            className={clsx(
                              selected ? "font-semibold" : "font-normal",
                              "block truncate"
                            )}
                          >
                            {option.label}
                          </span>

                          {selected ? (
                            <span
                              className={clsx(
                                active ? "text-white" : "text-sky-600",
                                "absolute inset-y-0 right-0 flex items-center pr-4"
                              )}
                            >
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
}
