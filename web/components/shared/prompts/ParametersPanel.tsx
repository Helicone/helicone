import { useEffect, useMemo, memo } from "react";
import {
  PiTargetBold,
  PiPaintBrushBold,
  PiPlugsBold,
  PiCaretDownBold,
} from "react-icons/pi";

const PROVIDERS = ["openai", "anthropic"] as const;
const MODELS = {
  openai: ["gpt-4o-mini", "gpt-4o"],
  anthropic: ["claude-3.5-haiku", "claude-3.5-sonnet"],
  // TODO: Add more providers and models
} as const;

interface Parameters {
  model: string;
  provider: string;
  temperature: number;
  // TODO: Add other parameters
}

interface ParametersPanelProps {
  parameters: Parameters;
  onParameterChange: (updates: Partial<Parameters>) => void;
}
export default function ParametersPanel({
  parameters,
  onParameterChange,
}: ParametersPanelProps) {
  // Initialize provider if not set
  useEffect(() => {
    if (!parameters.provider) {
      const defaultProvider = PROVIDERS[0];
      onParameterChange({
        provider: defaultProvider,
        model: MODELS[defaultProvider][0],
      });
    }
  }, [parameters.provider, onParameterChange]);

  const handleProviderChange = (provider: string) => {
    const validProvider = provider as keyof typeof MODELS;
    onParameterChange({
      provider: validProvider,
      model: MODELS[validProvider][0],
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">Parameters</h2>
      </div>
      <div className="divide-y divide-slate-100">
        <div className="flex flex-row items-center justify-between gap-4 py-2 first:pt-0">
          <div className="flex items-center gap-2">
            <PiPlugsBold className="text-slate-700" />
            <label className="text-sm font-medium text-slate-700">
              Provider / Model
            </label>
          </div>
          <div className="flex gap-2">
            <SelectDropdown
              value={parameters.provider}
              onChange={handleProviderChange}
              options={PROVIDERS}
              variant="sm"
            />
            <SelectDropdown
              value={parameters.model}
              onChange={(model) => onParameterChange({ model })}
              options={MODELS[parameters.provider as keyof typeof MODELS]}
              variant="lg"
            />
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2">
            {parameters.temperature < 1 ? (
              <PiTargetBold className="text-slate-700" />
            ) : (
              <PiPaintBrushBold className="text-slate-700" />
            )}
            <label className="text-sm font-medium text-slate-700">
              Temperature
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{parameters.temperature.toFixed(1)}</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={parameters.temperature}
              onChange={(e) =>
                onParameterChange({ temperature: parseFloat(e.target.value) })
              }
              className="flex-1 accent-heliblue w-48 h-2.5 rounded-full bg-slate-200 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-heliblue [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:cursor-grab"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  variant?: "sm" | "lg";
}

const SelectDropdown = memo(function SelectDropdown({
  value,
  onChange,
  options,
  variant = "lg",
}: SelectDropdownProps) {
  const optionElements = useMemo(
    () =>
      options.map((option) => (
        <option key={option} value={option} className="truncate">
          {option}
        </option>
      )),
    [options]
  );

  return (
    <div className={`relative ${variant === "sm" ? "w-28" : "w-44"}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="interactive w-full appearance-none rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-heliblue bg-white border border-slate-100 cursor-pointer hover:bg-slate-50 truncate"
      >
        {optionElements}
      </select>
      <PiCaretDownBold className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
    </div>
  );
});

SelectDropdown.displayName = "SelectDropdown";
