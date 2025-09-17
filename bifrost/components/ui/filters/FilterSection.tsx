"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface FilterSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export function FilterSection({
  title,
  expanded,
  onToggle,
  children,
  className = "",
}: FilterSectionProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between text-sm font-normal text-gray-700 dark:text-gray-300 mb-3"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && children}
    </div>
  );
}