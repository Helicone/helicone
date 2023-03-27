import { Fragment, useEffect, useRef, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { clsx } from "../clsx";
import { Column } from "../../ThemedTableV2";
import { TrashIcon } from "@heroicons/react/24/outline";

interface DropdownOption<T> {
  label: string;
  value: T;
  category?: string;
}

interface ThemedDropdownProps<T> {
  options: DropdownOption<T>[];
  selectedValue: T;
  onSelect: (option: T) => void;
  align?: "left" | "right";
  className?: string;
  label?: string;
}

export default function ThemedDropdown<T>(props: ThemedDropdownProps<T>) {
  const { selectedValue, onSelect, className, label, align = "left" } = props;
  let { options } = props;
  const selected = options.find((option) => option.value === selectedValue);
  const categories: {
    [key: string]: DropdownOption<T>[];
  } = options.reduce(
    (acc, option) => {
      if (option.category) {
        if (!acc[option.category]) {
          acc[option.category] = [];
        }
        acc[option.category].push(option);
      } else {
        if (!acc[""]) {
          acc[""] = [];
        }
        acc[""].push(option);
      }
      return acc;
    },
    {
      all: options,
    } as { [key: string]: DropdownOption<T>[] }
  );
  console.log("categories", categories);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  options = options.filter((option) => {
    if (selectedCategory === null || selectedCategory === "all") {
      return true;
    }
    return option.category === selectedCategory;
  });

  const [categorySelected, setCategorySelected] = useState(false);
  const transitionRef = useRef(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      transitionRef.current &&
      !(transitionRef.current as any).contains(event.target)
    ) {
      console.log("clicked outside");
      setCategorySelected(false);
    }
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  console.log("selected value", selectedValue);
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
                show={open || categorySelected}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div
                  ref={transitionRef}
                  className={clsx(
                    align === "left" ? "left-0" : "right-0",
                    "overflow-hidden absolute z-30 mt-1.5 max-h-80 w-full min-w-[300px] rounded-md bg-white py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  )}
                >
                  {Object.keys(categories).length >= 2 && (
                    <div className="text-gray-500 px-3 py-2 text-xs border-b-2">
                      Categories
                      <div className="flex flex-wrap">
                        {Object.entries(categories).map(
                          ([category, items], index) => (
                            <div
                              key={index}
                              className={
                                category === selectedCategory
                                  ? "bg-sky-600 text-white px-2 py-1 rounded-md mr-2 mt-2"
                                  : "bg-gray-200 px-2 py-1 rounded-md mr-2 mt-2"
                              }
                              onClick={() => {
                                setSelectedCategory(category);
                                setCategorySelected(true);
                              }}
                            >
                              {category} ({items.length})
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <Listbox.Options
                    className={clsx(
                      align === "left" ? "left-0" : "right-0",
                      "max-h-[200px] overflow-y-auto"
                    )}
                  >
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
                        onClick={() => {
                          setCategorySelected(false);
                        }}
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
                </div>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </div>
  );
}
