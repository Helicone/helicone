import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PROVIDER_MODELS } from "@/lib/api/llm/generate";
import { useEffect } from "react";
import { PiPaintBrushBold, PiPlugsBold, PiTargetBold } from "react-icons/pi";
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
