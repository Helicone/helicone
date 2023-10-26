import { Fragment, useEffect, useRef, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/20/solid";
import { clsx } from "../clsx";
import { TrashIcon } from "@heroicons/react/24/outline";

interface DropdownOption<T> {
  label: string;
  value: T;
  subtitle?: string;
  category?: string;
}

interface ThemedDropdownProps<T> {
  options?: DropdownOption<T>[];
  selectedValue: T;
  onSelect: (option: T) => void;
  verticalAlign?: "top" | "bottom";
  align?: "left" | "right";
  className?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function ThemedDropdown<T>(props: ThemedDropdownProps<T>) {
  const {
    selectedValue,
    onSelect,
    className,
    label,
    verticalAlign = "bottom",
    align = "left",
    placeholder = "Select an option",
    disabled = false,
  } = props;
  let { options } = props;
  const selected = options?.find((option) => option.value === selectedValue);
  const categories: {
    [key: string]: DropdownOption<T>[];
  } = options
    ? options.reduce(
        (acc, option) => {
          if (option.category) {
            if (!acc[option.category]) {
              acc[option.category] = [];
            }
            acc[option.category].push(option);
          }
          return acc;
        },
        {
          all: options,
        } as { [key: string]: DropdownOption<T>[] }
      )
    : {};

  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  options = options?.filter((option) => {
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
      setCategorySelected(false);
    }
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={className}>
      <Listbox value={selected?.value} onChange={onSelect} disabled={disabled}>
        {({ open }) => (
          <>
            <div className="relative">
              <Listbox.Button
                className={clsx(
                  disabled
                    ? "cursor-not-allowed bg-gray-100"
                    : "hover:cursor-pointer bg-white",
                  "relative w-full cursor-default rounded-md border border-gray-300 py-2 pl-3 pr-10 text-left shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-sm"
                )}
              >
                {label && (
                  <label
                    htmlFor="name"
                    className="absolute -top-2 sm:-top-2.5 left-2 inline-block bg-white px-0.5 text-[0.55rem] font-light text-gray-600"
                  >
                    {label}
                  </label>
                )}

                <span className="block truncate font-semibold">
                  {selected?.label || placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDownIcon
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
                    verticalAlign === "top"
                      ? "bottom-full mb-1.5"
                      : "top-full mt-1.5",
                    "absolute z-30 max-h-96 w-full min-w-[225px] rounded-md bg-white py-1 text-base shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                  )}
                >
                  {categories && Object.keys(categories).length >= 2 && (
                    <div className="text-gray-500 px-3 py-2 text-xs border-b-2">
                      Categories
                      <div className="flex flex-wrap">
                        {Object.entries(categories).map(
                          ([category, items], index) => (
                            <div
                              key={index}
                              className={clsx(
                                category === selectedCategory
                                  ? "bg-sky-600 text-white px-2 py-1 rounded-md mr-2 mt-2"
                                  : "bg-gray-200 px-2 py-1 rounded-md mr-2 mt-2 hover:bg-gray-300",
                                "hover:cursor-pointer"
                              )}
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
                      "max-h-[200px] divide-y divide-gray-200 overflow-auto"
                    )}
                  >
                    {options?.map((option, i) => (
                      <Listbox.Option
                        key={i}
                        className={({ active }) =>
                          clsx(
                            active
                              ? "text-sky-900 bg-sky-200"
                              : "text-gray-900",
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
                            <span className={clsx("block truncate text-md")}>
                              {option.label}
                              {option.subtitle && (
                                <p className="text-gray-500 font-light whitespace-pre-wrap text-sm">
                                  {option.subtitle}
                                </p>
                              )}
                            </span>

                            {selected ? (
                              <span
                                className={clsx(
                                  "text-sky-800",
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
