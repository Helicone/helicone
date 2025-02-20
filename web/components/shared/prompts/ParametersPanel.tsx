import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PROVIDER_MODELS } from "@/lib/api/llm/generate";
import { StateParameters } from "@/types/prompt-state";
import { useEffect } from "react";
import {
  PiBrainBold,
  PiPaintBrushBold,
  PiPlugsBold,
  PiTargetBold,
} from "react-icons/pi";

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
      const defaultProvider = Object.keys(PROVIDER_MODELS)[0];
      onParameterChange({
        provider: defaultProvider,
        model:
          PROVIDER_MODELS[defaultProvider as keyof typeof PROVIDER_MODELS]
            .models[0].name,
      });
    }
  }, [parameters.provider, onParameterChange]);

  const handleProviderChange = (provider: string) => {
    const validProvider = provider as keyof typeof PROVIDER_MODELS;
    onParameterChange({
      provider: validProvider,
      model: PROVIDER_MODELS[validProvider].models[0].name,
    });
  };

  const currentModel =
    parameters.provider && parameters.model
      ? PROVIDER_MODELS[
          parameters.provider as keyof typeof PROVIDER_MODELS
        ].models.find((m) => m.name === parameters.model)
      : undefined;

  const supportsReasoningEffort = currentModel?.supportsReasoningEffort;

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
                {Object.entries(PROVIDER_MODELS).map(([provider, config]) => (
                  <SelectItem key={provider} value={provider}>
                    {config.name}
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
                {parameters.provider &&
                  PROVIDER_MODELS[
                    parameters.provider as keyof typeof PROVIDER_MODELS
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
        {supportsReasoningEffort && (
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
      </div>
    </div>
  );
}
