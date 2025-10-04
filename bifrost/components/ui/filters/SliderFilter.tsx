"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";

interface SliderFilterProps {
  value: number | [number, number];
  onChange: (value: number | [number, number]) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  formatLabel?: (value: number | [number, number]) => string;
  className?: string;
}

export function SliderFilter({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  formatLabel,
  className = "",
}: SliderFilterProps) {
  const isRange = Array.isArray(value);
  const displayValue = formatLabel
    ? formatLabel(value)
    : isRange
      ? `${value[0]} - ${value[1]}`
      : value.toString();

  const handleChange = (newValue: number | number[]) => {
    if (isRange && Array.isArray(newValue)) {
      onChange(newValue as [number, number]);
    } else if (!isRange && typeof newValue === "number") {
      onChange(newValue);
    } else if (!isRange && Array.isArray(newValue)) {
      onChange(newValue[0]);
    }
  };

  return (
    <div className={`px-2 pb-2 ${className}`}>
      {label && (
        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {label}: {displayValue}
        </div>
      )}
      <Slider
        value={isRange ? value : [value]}
        onValueChange={handleChange}
        min={min}
        max={max}
        step={step}
        className="mb-1"
      />
    </div>
  );
}
