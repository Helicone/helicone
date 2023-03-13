import { Dispatch, SetStateAction, useState } from "react";
import { HomeIcon, KeyIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";

type ViewModeProps = {
  size: "sm" | "md";
  leftLabel: string;
  rightLabel: string;
  onSelectionChange?: (selection: "left" | "right") => void;
  selected: string;
  setSelected: any;
};

export function ViewMode({
  size = "sm",
  leftLabel,
  rightLabel,
  onSelectionChange,
  selected,
  setSelected,
}: ViewModeProps) {
  const handleSelection = (selection: "left" | "right") => {
    if (selected !== selection) {
      setSelected(selection);
      onSelectionChange?.(selection);
    }
  };

  return (
    <div className="flex items-center">
      <button
        className={clsx(
          selected === "left"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-500",
          `relative inline-flex items-center  transition-colors rounded-l-md cursor-pointer`,
          size === "sm" ? "text-xs w-20 h-6" : "text-sm w-24 h-8"
        )}
        onClick={() => handleSelection("left")}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          {/* <KeyIcon className="h-4 w-4 mr-1" /> */}
          {leftLabel}
        </span>
      </button>
      <button
        className={clsx(
          selected === "right"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-500",
          `relative inline-flex items-center  transition-colors rounded-r-md cursor-pointer`,
          size === "sm" ? "text-xs w-20 h-6" : "text-sm w-24 h-8"
        )}
        onClick={() => handleSelection("right")}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          {/* <HomeIcon className="h-4 w-4 mr-1" /> */}
          {rightLabel}
        </span>
      </button>
    </div>
  );
}
