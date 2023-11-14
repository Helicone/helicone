import { Fragment, useEffect, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { Combobox, Dialog, Transition } from "@headlessui/react";
import { clsx } from "../clsx";
import { Result } from "../../../lib/result";

interface ThemedTextDropDownProps {
  options: string[];
  onChange: (option: string | null) => void;
  value: string;
  onSearchHandler?: (search: string) => Promise<Result<void, string>>;
}

export function ThemedTextDropDown(props: ThemedTextDropDownProps) {
  const { options: parentOptions, onChange, value, onSearchHandler } = props;
  const [selected, setSelected] = useState(value);
  const [query, setQuery] = useState("");

  const customOption = query && !parentOptions.includes(query) ? query : null;

  const options = customOption
    ? parentOptions.concat([customOption])
    : parentOptions;

  const filteredPeople =
    query === ""
      ? options
      : options.filter((option) =>
          option
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  useEffect(() => {
    onSearchHandler?.(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="z-30">
      <Combobox
        value={selected}
        onChange={(v) => {
          setSelected(v);
          onChange(v);
        }}
      >
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-md bg-white dark:border-gray-700 dark:bg-black text-left border border-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-sky-300 sm:text-sm">
            <Combobox.Button
              as="div"
              className="right-0 flex items-center pr-2"
              onClick={() => onSearchHandler?.(query)}
            >
              <Combobox.Input
                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-100 bg-white font-semibold dark:bg-black focus:ring-0 auto"
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
              />
              <ChevronDownIcon
                className="h-5 w-5 text-gray-500"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options
              static
              className="z-30 absolute mt-1 max-h-60 w-full shadow-sm overflow-auto rounded-md bg-white border border-gray-300 dark:border-gray-700 dark:bg-black py-1 text-basering-opacity-5 focus:outline-none sm:text-sm"
            >
              {parentOptions.length === 0 && query === "" && (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Searching...
                </div>
              )}
              {filteredPeople.length === 0 && query !== "" ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Nothing found.
                </div>
              ) : (
                filteredPeople.map((person) => (
                  <Combobox.Option
                    key={person}
                    className={({ active }) =>
                      ` relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active
                          ? "bg-sky-500 text-white dark:text-black"
                          : "text-gray-900 dark:text-gray-100"
                      }`
                    }
                    value={person}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {person}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active
                                ? "text-white dark:text-black"
                                : "text-sky-500"
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}
