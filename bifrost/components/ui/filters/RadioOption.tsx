"use client";

import React from "react";

interface RadioOptionProps {
  label: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  className?: string;
}

export function RadioOption({
  label,
  value,
  selected,
  onSelect,
  className = "",
}: RadioOptionProps) {
  return (
    <div
      onClick={() => onSelect(value)}
      className={`flex items-center justify-between px-2 py-1.5 text-sm cursor-pointer transition-colors text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}
    >
      <span className="truncate flex-1 mr-2">{label}</span>
      {selected && (
        <div className="w-2 h-2 bg-sky-600 dark:bg-sky-400 rounded-full" />
      )}
    </div>
  );
}