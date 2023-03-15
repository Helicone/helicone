import { useState } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "../clsx";

interface ThemedToggleProps {
  options: string[];
  onOptionSelect: (option: string) => void;
}
export default function ThemedToggle(props: ThemedToggleProps) {
  const { options, onOptionSelect } = props;

  return (
    <div className="inline-flex px-2 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-lg bg-gray-300 p-0.5">
          {options.map((option, idx) => (
            <Tab
              key={idx}
              className={({ selected }) =>
                clsx(
                  "w-full rounded-md px-3 py-1.5 text-sm font-medium leading-5",
                  selected
                    ? "bg-white shadow text-sky-500"
                    : " hover:cursor-pointer"
                )
              }
              onClick={() => onOptionSelect(option)}
            >
              {option}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>
    </div>
  );
}
