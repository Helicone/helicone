import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { StateParameters } from "@/types/prompt-state";
import {
  ModelInfo,
  PROVIDER_MODELS,
  SupportedProviders,
} from "@/utils/generate";
import { useEffect } from "react";
import {
  PiBrainBold,
  PiCoinsBold,
  PiPaintBrushBold,
  PiPlugsBold,
  PiTargetBold,
} from "react-icons/pi";
import GlassHeader from "../universal/GlassHeader";

interface ParametersPanelProps {
  parameters: StateParameters;
  onParameterChange: (updates: Partial<StateParameters>) => void;
}

export default function ParametersPanel({
  parameters,
  onParameterChange,
}: ParametersPanelProps) {
  // Initialize provider if not set
  useEffect(() => {
    if (!parameters.provider) {
      const defaultProvider = Object.keys(
        PROVIDER_MODELS
      )[0] as SupportedProviders;
      onParameterChange({
        provider: defaultProvider ?? "OPENAI",
        model: PROVIDER_MODELS?.[defaultProvider]?.models[0].name ?? "gpt-4o",
      });
    }
  }, [parameters.provider, onParameterChange]);

  const handleProviderChange = (provider: string) => {
    const validProvider = provider as SupportedProviders;
    onParameterChange({
      provider: validProvider,
    });

    // Get the default model for this provider and update it using handleModelChange
    const defaultModel =
      PROVIDER_MODELS?.[validProvider]?.models[0]?.name ?? "gpt-4o-mini";

    // Pass the newly selected provider to ensure we use the correct context
    handleModelChange(defaultModel, validProvider);
  };

  const handleModelChange = (
    model: string,
    newProvider?: SupportedProviders
  ) => {
    // Use the new provider if provided (from provider change), otherwise use current state
    const providerToUse = newProvider || parameters.provider;

    // Find the selected model info
    const selectedModel = providerToUse
      ? PROVIDER_MODELS[providerToUse]?.models.find((m) => m.name === model)
      : undefined;

    const updates: Partial<StateParameters> = { model };

    // Handle max_tokens based on the selected model
    if (selectedModel?.max_tokens) {
      // Always set max_tokens when the model has it defined
      updates.max_tokens = selectedModel.max_tokens;
    } else if (parameters.max_tokens !== undefined) {
      // If the model doesn't support max_tokens, remove it from state
      updates.max_tokens = undefined;
    }

    onParameterChange(updates);
  };

  // Get the current model info
  const currentModel =
    parameters.provider && parameters.model
      ? (PROVIDER_MODELS?.[
          parameters.provider as SupportedProviders
        ]?.models.find((m) => m.name === parameters.model) as
          | ModelInfo
          | undefined)
      : undefined;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <GlassHeader className="h-14 px-4">
        <h2 className="font-semibold text-secondary">Parameters</h2>
      </GlassHeader>
      <div className="divide-y divide-slate-100 dark:divide-slate-900 px-4">
        <div className="flex flex-row items-center justify-between gap-4 py-1 first:pt-0">
          <div className="flex items-center gap-2">
            <PiPlugsBold className="text-secondary" />
            <label className="text-sm font-medium text-secondary">
              Provider / Model
            </label>
          </div>
          <div className="flex gap-2">
            <Select
              value={parameters.provider as string}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger className="w-28 h-8">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_MODELS).map(([provider, config]) => (
                  <SelectItem key={provider} value={provider}>
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={parameters.model}
              onValueChange={(model) => handleModelChange(model)}
            >
              <SelectTrigger className="w-44 h-8">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {parameters.provider &&
                  PROVIDER_MODELS[
                    parameters.provider as SupportedProviders
                  ]?.models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      {model.name}
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
        {currentModel?.supportsReasoningEffort && (
          <div className="flex flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2">
              <PiBrainBold className="text-secondary" />
              <label className="text-sm font-medium text-secondary">
                Reasoning Effort
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={parameters.reasoning_effort || "medium"}
                onValueChange={(value) =>
                  onParameterChange({
                    reasoning_effort: value as "low" | "medium" | "high",
                  })
                }
              >
                <SelectTrigger className="w-28 h-8">
                  <SelectValue placeholder="Effort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {currentModel?.max_tokens && (
          <div className="flex flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2">
              <PiCoinsBold className="text-secondary" />
              <label className="text-sm font-medium text-secondary">
                Max Tokens
              </label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {parameters.max_tokens?.toLocaleString()}
              </span>
              <Slider
                value={[parameters.max_tokens ?? 1024]}
                min={1024}
                max={currentModel?.max_tokens}
                step={1024}
                onValueChange={([value]) =>
                  onParameterChange({ max_tokens: value })
                }
                className="h-8 w-48"
                variant="action"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
