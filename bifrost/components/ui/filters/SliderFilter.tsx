"use client";

import React, { useState, useRef, useMemo } from "react";
import { Slider } from "@/components/ui/slider";

interface SliderFilterProps {
  value: number | [number, number];
  onChange: (value: number | [number, number]) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  formatLabel?: (value: number | [number, number]) => string;
  formatValue?: (value: number) => string;
  showTicks?: boolean;
  tickCount?: number;
  weighted?: boolean;
  className?: string;
}

// Convert linear position (0-1) to weighted value
function linearToWeighted(linear: number, min: number, max: number): number {
  const power = 2.5;
  const weightedRatio = Math.pow(linear, power);
  return min + weightedRatio * (max - min);
}

// Convert weighted value to linear position (0-1)
function weightedToLinear(value: number, min: number, max: number): number {
  if (max === min) return 0;
  const power = 2.5;
  const ratio = Math.max(0, (value - min) / (max - min));
  return Math.pow(ratio, 1 / power);
}

// Snap value to appropriate step based on magnitude
function snapToStep(value: number): number {
  if (value <= 1) {
    return Math.round(value * 10) / 10;
  } else if (value <= 10) {
    return Math.round(value * 2) / 2;
  } else if (value <= 50) {
    return Math.round(value);
  } else if (value <= 100) {
    return Math.round(value / 5) * 5;
  } else {
    return Math.round(value / 10) * 10;
  }
}

export function SliderFilter({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  formatLabel,
  formatValue,
  showTicks = false,
  tickCount = 10,
  weighted = false,
  className = "",
}: SliderFilterProps) {
  const isRange = Array.isArray(value);
  const displayValue = formatLabel
    ? formatLabel(value)
    : isRange
      ? `${value[0]} - ${value[1]}`
      : value.toString();

  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Convert actual values to linear slider positions (0-100 scale for slider)
  const linearValue = useMemo((): number[] => {
    if (!weighted) {
      return isRange ? (value as [number, number]) : [value as number];
    }
    if (isRange) {
      return [
        weightedToLinear(value[0], min, max) * 100,
        weightedToLinear(value[1], min, max) * 100,
      ];
    }
    return [weightedToLinear(value as number, min, max) * 100];
  }, [value, min, max, weighted, isRange]);

  const handleChange = (newLinearValue: number[]) => {
    if (!weighted) {
      if (isRange) {
        onChange(newLinearValue as [number, number]);
      } else {
        onChange(newLinearValue[0]);
      }
      return;
    }

    // Convert linear slider position back to weighted value
    if (isRange) {
      const weightedMin = snapToStep(
        linearToWeighted(newLinearValue[0] / 100, min, max)
      );
      const weightedMax = snapToStep(
        linearToWeighted(newLinearValue[1] / 100, min, max)
      );
      onChange([
        Math.max(min, Math.min(max, weightedMin)),
        Math.max(min, Math.min(max, weightedMax)),
      ]);
    } else {
      const weightedVal = snapToStep(
        linearToWeighted(newLinearValue[0] / 100, min, max)
      );
      onChange(Math.max(min, Math.min(max, weightedVal)));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));

    let calculatedValue: number;
    if (weighted) {
      calculatedValue = snapToStep(linearToWeighted(percentage, min, max));
    } else {
      const rawValue = min + percentage * (max - min);
      calculatedValue = Math.round(rawValue / step) * step;
    }

    const clampedValue = Math.max(min, Math.min(max, calculatedValue));

    setHoverValue(clampedValue);
    setHoverPosition(x);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  // Generate tick marks at meaningful price points for weighted slider
  const ticks = useMemo(() => {
    if (!showTicks) return [];

    if (weighted) {
      const pricePoints = [0, 0.5, 1, 2, 5, 10, 20, 50, 100, 200];
      return pricePoints
        .filter((p) => p >= min && p <= max)
        .map((p) => ({
          position: weightedToLinear(p, min, max),
          value: p,
        }));
    }

    return Array.from({ length: tickCount + 1 }, (_, i) => ({
      position: i / tickCount,
      value: min + (i / tickCount) * (max - min),
    }));
  }, [showTicks, weighted, min, max, tickCount]);

  const formatDisplayValue = (val: number) => {
    if (formatValue) return formatValue(val);
    if (val < 1) return `$${val.toFixed(2)}`;
    if (val < 10) return `$${val.toFixed(1)}`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className={`px-2 pb-2 ${className}`}>
      {/* Label with current value */}
      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        {label ? `${label}: ` : ""}{displayValue}
      </div>

      <div
        ref={sliderRef}
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Hover tooltip */}
        {hoverValue !== null && (
          <div
            className="absolute -top-7 transform -translate-x-1/2 pointer-events-none z-10"
            style={{ left: hoverPosition }}
          >
            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
              {formatDisplayValue(hoverValue)}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
          </div>
        )}

        <Slider
          value={linearValue}
          onValueChange={handleChange}
          min={weighted ? 0 : min}
          max={weighted ? 100 : max}
          step={weighted ? 0.1 : step}
        />

        {/* Tick marks and labels */}
        {showTicks && (
          <div className="relative mt-1">
            {/* Tick marks */}
            <div className="relative h-1.5">
              {ticks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute w-px h-1.5 bg-gray-300 dark:bg-gray-600"
                  style={{ left: `${tick.position * 100}%` }}
                />
              ))}
            </div>

            {/* Min and Max labels */}
            <div className="flex justify-between mt-0.5">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatDisplayValue(min)}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatDisplayValue(max)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
