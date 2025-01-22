import { useEffect, useMemo, memo } from "react";
import {
  PiTargetBold,
  PiPaintBrushBold,
  PiPlugsBold,
  PiCaretDownBold,
} from "react-icons/pi";

const PROVIDERS = [
  "anthropic",
  "google",
  "meta-llama",
  "mistralai",
  "openai",
  "cohere",
  "qwen",
  "nousresearch",
  "x-ai",
  "amazon",
  "microsoft",
  "perplexity",
  "deepseek",
  "nvidia",
  "sao10k",
  "neversleep",
  "eva-unit-01",
  "gryphe",
  "liquid",
  "alpindale",
  "aetherwiing",
  "cognitivecomputations",
  "infermatic",
  "thedrummer",
  "undi95",
] as const;

const MODELS = {
  anthropic: ["claude-3.5-haiku", "claude-3.5-sonnet", "claude-3-opus"],
  google: [
    "gemini-flash-1.5",
    "gemini-flash-1.5-8b",
    "gemini-pro-1.5",
    "gemini-pro",
    "gemini-flash-1.5-8b-exp",
    "gemma-2-27b-it",
    "gemma-2-9b-it",
  ],
  "meta-llama": [
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
  mistralai: [
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
  openai: [
    "gpt-4o-mini",
    "gpt-4o",
    // "o1-preview",
    // "o1-mini",
    // "o1-preview-2024-09-12",
    // "o1-mini-2024-09-12",
    "gpt-4-turbo",
    "gpt-4",
    "gpt-3.5-turbo",
    "chatgpt-4o-latest",
  ],
  cohere: [
    "command-r-08-2024",
    "command-r-plus-08-2024",
    "command-r-plus",
    "command-r",
    "command-r-plus-04-2024",
    "command-r7b-12-2024",
  ],
  qwen: [
    "qwen-2.5-coder-32b-instruct",
    "qwen-2.5-72b-instruct",
    "qwen-2.5-7b-instruct",
    "qwen-2-vl-7b-instruct",
    "qwen-2-vl-72b-instruct",
    "qwq-32b-preview",
    "qvq-72b-preview",
    "qwen-2-72b-instruct",
  ],
  nousresearch: [
    "hermes-3-llama-3.1-405b",
    "hermes-3-llama-3.1-70b",
    "hermes-2-pro-llama-3-8b",
    "nous-hermes-llama2-13b",
  ],
  "x-ai": ["grok-2-1212", "grok-beta", "grok-2-vision-1212"],
  amazon: ["nova-lite-v1", "nova-micro-v1", "nova-pro-v1"],
  microsoft: ["wizardlm-2-8x22b", "wizardlm-2-7b", "phi-4"],
  perplexity: [
    "llama-3.1-sonar-large-128k-online",
    "llama-3.1-sonar-large-128k-chat",
    "llama-3.1-sonar-huge-128k-online",
    "llama-3.1-sonar-small-128k-online",
  ],
  deepseek: ["deepseek-r1", "deepseek-chat"],
  nvidia: ["llama-3.1-nemotron-70b-instruct"],
  sao10k: [
    "l3-euryale-70b",
    "l3.1-euryale-70b",
    "l3-lunaris-8b",
    "l3.1-70b-hanami-x1",
  ],
  neversleep: [
    "llama-3-lumimaid-8b",
    "llama-3.1-lumimaid-8b",
    "llama-3-lumimaid-70b",
    "llama-3.1-lumimaid-70b",
    "noromaid-20b",
  ],
  "eva-unit-01": ["eva-qwen-2.5-72b", "eva-llama-3.33-70b"],
  gryphe: [
    "mythomax-l2-13b",
    "mythomax-l2-13b:nitro",
    "mythomax-l2-13b:extended",
  ],
  alpindale: ["goliath-120b", "magnum-72b"],
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
