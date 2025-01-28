import { useEffect, useMemo, memo } from "react";
import {
  PiTargetBold,
  PiPaintBrushBold,
  PiPlugsBold,
  PiCaretDownBold,
} from "react-icons/pi";

const PROVIDER_MODELS = {
  // General Use Cases
  anthropic: {
    models: ["claude-3.5-haiku", "claude-3.5-sonnet", "claude-3-opus"],
  },
  openai: {
    models: [
      "gpt-4o-mini",
      "gpt-4o",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
      "chatgpt-4o-latest",
    ],
  },
  google: {
    models: [
      "gemini-flash-1.5",
      "gemini-flash-1.5-8b",
      "gemini-pro-1.5",
      "gemma-2-27b-it",
      "gemma-2-9b-it",
    ],
  },
  "meta-llama": {
    models: [
      "llama-3.1-70b-instruct",
      "llama-3.1-8b-instruct",
      "llama-3.1-405b-instruct",
      "llama-3.2-1b-instruct",
      "llama-3.2-3b-instruct",
      "llama-3.2-11b-vision-instruct",
      "llama-3.2-90b-vision-instruct",
      "llama-3-70b-instruct",
      "llama-3-8b-instruct",
      "llama-3-70b-instruct:nitro",
      "llama-3-8b-instruct:nitro",
      "llama-3-8b-instruct:extended",
      "llama-guard-2-8b",
      "llama-3.1-405b",
    ],
  },
  deepseek: {
    models: ["deepseek-r1", "deepseek-chat"],
  },
  mistralai: {
    models: [
      "mistral-nemo",
      "codestral-2501",
      "mixtral-8x7b-instruct",
      "ministral-8b",
      "ministral-3b",
      "mistral-7b-instruct",
      "mistral-large",
      "mistral-small",
      "codestral-mamba",
      "pixtral-12b",
      "pixtral-large-2411",
      "mistral-7b-instruct-v0.1",
      "mistral-7b-instruct-v0.3",
      "mistral-medium",
      "mistral-large-2411",
      "mistral-large-2407",
      "mixtral-8x7b-instruct:nitro",
      "mixtral-8x22b-instruct",
      "mistral-tiny",
    ],
  },
  qwen: {
    models: [
      "qwen-2.5-72b-instruct",
      "qwen-2.5-7b-instruct",
      "qwen-2.5-coder-32b-instruct",
      "eva-qwen-2.5-72b",
    ],
  },
  "x-ai": {
    models: ["grok-2-1212", "grok-beta", "grok-2-vision-1212"],
  },
  perplexity: {
    models: [
      "llama-3.1-sonar-large-128k-online",
      "llama-3.1-sonar-large-128k-chat",
      "llama-3.1-sonar-huge-128k-online",
      "llama-3.1-sonar-small-128k-online",
    ],
  },
  cohere: {
    models: ["command-r-plus", "command-r"],
  },
  amazon: {
    models: ["nova-lite-v1", "nova-micro-v1", "nova-pro-v1"],
  },
  microsoft: {
    models: ["wizardlm-2-8x22b", "wizardlm-2-7b", "phi-4"],
  },
  nvidia: {
    models: ["llama-3.1-nemotron-70b-instruct"],
  },
  // Finetunes and Roleplay Use Cases
  nousresearch: {
    models: [
      "hermes-3-llama-3.1-405b",
      "hermes-3-llama-3.1-70b",
      "hermes-2-pro-llama-3-8b",
      "nous-hermes-llama2-13b",
    ],
  },
  sao10k: {
    models: [
      "l3-euryale-70b",
      "l3.1-euryale-70b",
      "l3-lunaris-8b",
      "l3.1-70b-hanami-x1",
    ],
  },
  gryphe: {
    models: [
      "mythomax-l2-13b",
      "mythomax-l2-13b:nitro",
      "mythomax-l2-13b:extended",
    ],
  },
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
      const defaultProvider = Object.keys(PROVIDER_MODELS)[0];
      onParameterChange({
        provider: defaultProvider,
        model:
          PROVIDER_MODELS[defaultProvider as keyof typeof PROVIDER_MODELS]
            .models[0],
      });
    }
  }, [parameters.provider, onParameterChange]);

  const handleProviderChange = (provider: string) => {
    const validProvider = provider as keyof typeof PROVIDER_MODELS;
    onParameterChange({
      provider: validProvider,
      model: PROVIDER_MODELS[validProvider].models[0],
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
              options={Object.keys(PROVIDER_MODELS)}
              variant="sm"
            />
            <SelectDropdown
              value={parameters.model}
              onChange={(model) => onParameterChange({ model })}
              options={
                PROVIDER_MODELS[
                  parameters.provider as keyof typeof PROVIDER_MODELS
                ].models
              }
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
