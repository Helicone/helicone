import { ForwardRefExoticComponent, SVGProps } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "../clsx";

interface ThemedTabsProps {
  options: {
    label: string;
    icon: ForwardRefExoticComponent<
      SVGProps<SVGSVGElement> & {
        title?: string | undefined;
        titleId?: string | undefined;
      }
    >;
  }[];
  onOptionSelect: (option: string) => void;
  initialIndex?: number;
  breakpoint?: "sm" | "md" | "lg" | "xl" | "2xl";
}
export default function ThemedTabs(props: ThemedTabsProps) {
  const { options, onOptionSelect, initialIndex, breakpoint = "sm" } = props;

  return (
    <div className="inline-flex px-2 sm:px-0">
      <Tab.Group defaultIndex={initialIndex}>
        <Tab.List className="flex space-x-1 rounded-lg bg-gray-200 p-0.5 shadow-sm dark:bg-gray-800">
          {options.map((option, idx) => (
            <Tab
              key={idx}
              className={({ selected }) =>
                clsx(
                  "flex w-full flex-row rounded-md px-2.5 py-1.5 text-sm font-medium leading-5",
                  selected
                    ? "bg-white text-gray-900 shadow dark:bg-black dark:text-gray-100"
                    : "text-gray-500 hover:cursor-pointer",
                )
              }
              onClick={() => onOptionSelect(option.label)}
            >
              {({ selected }) => (
                <div className="flex w-fit flex-row items-center space-x-2">
                  <option.icon
                    className={clsx(
                      selected
                        ? "text-blue-500 dark:text-blue-500"
                        : "text-gray-500",
                      "inline-block h-5 w-5",
                    )}
                  />
                  <p className={`hidden w-max ${breakpoint}:inline`}>
                    {option.label}
                  </p>
                </div>
              )}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>
    </div>
  );
}
