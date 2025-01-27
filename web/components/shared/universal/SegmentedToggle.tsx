interface SegmentedToggleProps {
  mode?: "single" | "multiple";
  value: number | number[];
  onChange: (value: number | number[]) => void;
  segments: Array<{
    label: string;
    badge?: string;
  }>;
  className?: string;
}

export default function SegmentedToggle({
  mode = "single",
  value,
  onChange,
  segments,
  className = "",
}: SegmentedToggleProps) {
  const isSelected = (index: number) => {
    if (mode === "single") {
      return value === index;
    }
    return Array.isArray(value) && value.includes(index);
  };

  const handleClick = (index: number) => {
    if (mode === "single") {
      onChange(index);
    } else {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(index)
        ? currentValue.filter((v) => v !== index)
        : [...currentValue, index];
      onChange(newValue);
    }
  };

  return (
    <div
      className={`flex h-8 rounded-full bg-slate-200 py-0.5 px-[2px] select-none transition-transform border border-slate-100 ${className}`}
      role={mode === "single" ? "tablist" : "group"}
    >
      {segments.map((segment, index) => {
        const isFirst = index === 0;
        const isLast = index === segments.length - 1;

        return (
          <button
            key={index}
            type="button"
            role={mode === "single" ? "tab" : "checkbox"}
            aria-selected={isSelected(index)}
            aria-checked={mode === "multiple" ? isSelected(index) : undefined}
            className={`relative flex-1 flex items-center justify-center transition-all duration-200 active:scale-95 hover:shadow-md
              ${isSelected(index) ? "bg-white font-bold" : "text-slate-700"}
              ${isFirst ? "rounded-l-full" : ""}
              ${isLast ? "rounded-r-full" : ""}
              text-xs font-medium px-2.5`}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(index);
            }}
          >
            <span className="whitespace-nowrap">{segment.label}</span>
            {segment.badge && (
              <span className="ml-1 text-modulue">({segment.badge})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
