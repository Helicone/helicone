import { Fragment, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Combobox, Dialog, Transition } from "@headlessui/react";
import { clsx } from "../clsx";

interface ThemedTextDropDownProps {
  options: string[];
  onChange: (option: string) => void;
  value: string;
}

export default function ThemedTextDropDown(props: ThemedTextDropDownProps) {
  const { options, onChange, value } = props;
  const [isFocused, setIsFocused] = useState(false);

  const filteredPeople = isFocused
    ? options.filter((data) => {
        return data.toLowerCase().includes(value.toLowerCase());
      })
    : [];
  const selectedChoice =
    filteredPeople.length === 1 && filteredPeople[0] === value;

  return (
    <div className="max-w-xl transform divide-y divide-gray-100 h-9 z-10 overflow-visible rounded-md bg-white shadow-2xl ring-1 ring-opacity-5 transition-all">
      <Combobox value={value} onChange={(value) => onChange(value)}>
        <div className="relative">
          <Combobox.Input
            className="h-8 w-full border-0 bg-transparent pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Search..."
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        <div
          className={clsx(
            "border-0 bg-white",
            (filteredPeople.length === 0 || selectedChoice) && "hidden"
          )}
        >
          {filteredPeople.length > 0 && (
            <Combobox.Options
              static
              className="max-h-72 scroll-py-2 overflow-y-auto py-2 text-sm text-gray-800"
            >
              {filteredPeople.map((person) => (
                <Combobox.Option
                  key={person}
                  value={person}
                  className={({ active }) =>
                    clsx(
                      "cursor-default select-none px-4 py-2",
                      active && "bg-indigo-600 text-white"
                    )
                  }
                >
                  {person}
                </Combobox.Option>
              ))}
            </Combobox.Options>
          )}
        </div>

        {value !== "" && filteredPeople.length === 0 && (
          <p className="p-4 text-sm text-gray-500">nothing found.</p>
        )}
      </Combobox>
    </div>
  );
}
