import { useEffect } from "react";
import { PiTargetBold, PiPaintBrushBold, PiPlugsBold } from "react-icons/pi";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

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
      {/* Header */}
      <div className="h-8 flex items-center justify-between">
        <h2 className="font-semibold text-secondary">Parameters</h2>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-900">
        <div className="flex flex-row items-center justify-between gap-4 py-1 first:pt-0">
          <div className="flex items-center gap-2">
            <PiPlugsBold className="text-secondary" />
            <label className="text-sm font-medium text-secondary">
              Provider / Model
            </label>
          </div>
          <div className="flex gap-2">
            <Select
              value={parameters.provider}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger className="w-28 h-8">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PROVIDER_MODELS).map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={parameters.model}
              onValueChange={(model) => onParameterChange({ model })}
            >
              <SelectTrigger className="w-44 h-8">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_MODELS[
                  parameters.provider as keyof typeof PROVIDER_MODELS
                ].models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2">
            {parameters.temperature < 1 ? (
              <PiTargetBold className="text-secondary" />
            ) : (
              <PiPaintBrushBold className="text-secondary" />
            )}
            <label className="text-sm font-medium text-secondary">
              Temperature
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{parameters.temperature.toFixed(1)}</span>
            <Slider
              value={[parameters.temperature]}
              min={0}
              max={2}
              step={0.01}
              onValueChange={([value]) =>
                onParameterChange({ temperature: value })
              }
              className="h-8 w-48"
              variant="action"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
