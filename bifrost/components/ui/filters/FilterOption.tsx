"use client";

import React from "react";
import { X } from "lucide-react";

interface FilterOptionProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  className?: string;
}

export function FilterOption({
  label,
  selected,
  onToggle,
  className = "",
}: FilterOptionProps) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}
    >
      <span className="text-sm truncate flex-1 mr-2">{label}</span>
      {selected && <X className="h-3 w-3 text-sky-600 dark:text-sky-400" />}
    </div>
  );
}
