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
  findCreatorForProviderAndModel,
  getModelConfig,
  getModelInfoFromModelString,
  getModelsForCreator,
  getModelString,
  getProvidersForModel,
  modelMapping,
} from "packages/cost/unified/models";
import {
  Creator,
  Parameters,
  Provider,
  ProviderModel,
} from "packages/cost/unified/types";
import { useEffect, useMemo, useState } from "react";
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
  // State for the creator selection (purely for organization)
  const [selectedCreator, setSelectedCreator] = useState<Creator>("OpenAI");

  // Determine the creator based on the current provider and model
  useEffect(() => {
    if (parameters.provider && parameters.model) {
      const creator = findCreatorForProviderAndModel(
        parameters.provider as Provider,
        parameters.model
      );
      if (creator) {
        setSelectedCreator(creator);
      }
    }
  }, [parameters.provider, parameters.model]);

  // Memoize the list of available creators to prevent unnecessary re-renders
  const creators: Creator[] = useMemo(
    () => ["OpenAI", "Anthropic", "Google"],
    []
  );

  // Memoize the list of models for the selected creator
  const models = useMemo(
    () => getModelsForCreator(selectedCreator),
    [selectedCreator]
  );

  // Get model info from the model string
  const modelInfo = useMemo(() => {
    if (!parameters.model) return null;
    return getModelInfoFromModelString(parameters.model);
  }, [parameters.model]);

  // Find and memoize the current model name based on the model string
  const currentModelName = useMemo(() => {
    if (modelInfo) {
      return modelInfo.modelName;
    }

    return models.find((model) => {
      const providers = getProvidersForModel(selectedCreator, model);
      return providers.some((provider) => {
        const modelString = getModelString(selectedCreator, model, provider);
        return modelString === parameters.model;
      });
    });
  }, [models, parameters.model, selectedCreator, modelInfo]);

  // Memoize the list of providers for the current model
  const providers = useMemo(
    () =>
      currentModelName
        ? getProvidersForModel(selectedCreator, currentModelName)
        : [],
    [currentModelName, selectedCreator]
  );

  // Memoize the model parameters
  const mergedParams = useMemo(() => {
    const creatorModels = modelMapping[selectedCreator];
    const modelParams = currentModelName
      ? creatorModels?.[currentModelName]?.defaultParameters
      : null;
    const providerModelParams =
      currentModelName && parameters.provider
        ? creatorModels?.[currentModelName]?.providers.find(
            (p: ProviderModel) => p.provider === parameters.provider
          )?.parameters
        : null;

    // Merge default parameters with provider-specific parameters
    return currentModelName
      ? {
          ...(modelParams || {}),
          ...(providerModelParams || {}),
        }
      : null;
  }, [currentModelName, parameters.provider, selectedCreator]);

  // Memoize derived parameter values
  const supportsReasoningEffort = useMemo(
    () => !!mergedParams?.reasoning_effort,
    [mergedParams]
  );

  const maxTokens = useMemo(() => mergedParams?.max_tokens, [mergedParams]);

  // Initialize provider if not set
  useEffect(() => {
    if (!parameters.provider) {
      // Default to OpenAI/gpt-4o
      const defaultCreator: Creator = "OpenAI";
      const defaultModel = "GPT-4o mini";
      const defaultProvider: Provider = "OPENAI";

      setSelectedCreator(defaultCreator);

      // Get the model string for this combination
      const modelString = getModelString(
        defaultCreator,
        defaultModel,
        defaultProvider
      );

      if (modelString) {
        onParameterChange({
          provider: defaultProvider,
          model: modelString,
        });
      }
    }
  }, [parameters.provider, onParameterChange]);

  // Handle creator change
  const handleCreatorChange = (creator: string) => {
    const validCreator = creator as Creator;
    setSelectedCreator(validCreator);

    // Get the first model for this creator
    const models = getModelsForCreator(validCreator);
    if (models.length > 0) {
      const defaultModel = models[0];

      // Get the first provider for this model
      const providers = getProvidersForModel(validCreator, defaultModel);
      if (providers.length > 0) {
        const defaultProvider = providers[0];

        // Get the model string for this combination
        const modelString = getModelString(
          validCreator,
          defaultModel,
          defaultProvider
        );

        if (modelString) {
          onParameterChange({
            provider: defaultProvider,
            model: modelString,
          });
        }
      }
    }
  };

  // Handle model change
  const handleModelChange = (model: string) => {
    // Get the providers for this model
    const providers = getProvidersForModel(selectedCreator, model);

    if (providers.length > 0) {
      // Default to the first provider or keep the current one if it's valid
      let providerToUse = providers[0];
      if (
        parameters.provider &&
        providers.includes(parameters.provider as Provider)
      ) {
        providerToUse = parameters.provider as Provider;
      }

      // Get the model string for this combination
      const modelString = getModelString(selectedCreator, model, providerToUse);

      if (modelString) {
        // Get the model config to check for parameters
        const modelConfig = getModelConfig(
          selectedCreator,
          model,
          providerToUse
        );

        const updates: Partial<StateParameters> = {
          provider: providerToUse,
          model: modelString,
        };

        // Get the model parameters from the creator models mapping
        const creatorModels = modelMapping[selectedCreator];
        const modelParams = creatorModels?.[model]?.defaultParameters;
        const providerModelParams = creatorModels?.[model]?.providers.find(
          (p: ProviderModel) => p.provider === providerToUse
        )?.parameters;

        // Merge default parameters with provider-specific parameters
        const mergedParams: Parameters = {
          ...(modelParams || {}),
          ...(providerModelParams || {}),
        };

        // Handle max_tokens based on the model parameters
        if (mergedParams.max_tokens) {
          updates.max_tokens = mergedParams.max_tokens;
        } else if (parameters.max_tokens !== undefined) {
          updates.max_tokens = undefined;
        }

        // Handle reasoning_effort if the model supports it
        if (mergedParams.reasoning_effort) {
          updates.reasoning_effort = mergedParams.reasoning_effort;
        }

        onParameterChange(updates);
      }
    }
  };

  // Handle provider change
  const handleProviderChange = (provider: string) => {
    const validProvider = provider as Provider;

    // Try to keep the current model if it's compatible with the new provider
    if (currentModelName) {
      const providersForCurrentModel = getProvidersForModel(
        selectedCreator,
        currentModelName
      );

      // Check if the new provider is compatible with the current model
      if (providersForCurrentModel.includes(validProvider)) {
        // Get the model string for this combination
        const modelString = getModelString(
          selectedCreator,
          currentModelName,
          validProvider
        );

        if (modelString) {
          // Get the model config to check for parameters
          const modelConfig = getModelConfig(
            selectedCreator,
            currentModelName,
            validProvider
          );

          const updates: Partial<StateParameters> = {
            provider: validProvider,
            model: modelString,
          };

          // Get the model parameters from the creator models mapping
          const creatorModels = modelMapping[selectedCreator];
          const modelParams =
            creatorModels?.[currentModelName]?.defaultParameters;
          const providerModelParams = creatorModels?.[
            currentModelName
          ]?.providers.find(
            (p: ProviderModel) => p.provider === validProvider
          )?.parameters;

          // Merge default parameters with provider-specific parameters
          const mergedParams: Parameters = {
            ...(modelParams || {}),
            ...(providerModelParams || {}),
          };

          // Handle max_tokens based on the model parameters
          if (mergedParams.max_tokens) {
            updates.max_tokens = mergedParams.max_tokens;
          } else if (parameters.max_tokens !== undefined) {
            updates.max_tokens = undefined;
          }

          // Handle reasoning_effort if the model supports it
          if (mergedParams.reasoning_effort) {
            updates.reasoning_effort = mergedParams.reasoning_effort;
          }

          onParameterChange(updates);
          return;
        }
      }
    }

    // If we can't keep the current model, find a compatible model for the new provider
    const compatibleModel = models.find((model) => {
      const providers = getProvidersForModel(selectedCreator, model);
      return providers.includes(validProvider);
    });

    if (compatibleModel) {
      // Get the model string for this combination
      const modelString = getModelString(
        selectedCreator,
        compatibleModel,
        validProvider
      );

      if (modelString) {
        onParameterChange({
          provider: validProvider,
          model: modelString,
        });
      }
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <GlassHeader className="h-14 px-4">
        <h2 className="font-semibold text-secondary">Parameters</h2>
      </GlassHeader>
      <div className="divide-y divide-slate-100 dark:divide-slate-900 px-4">
        {/* Creator / Model / Provider */}
        <div className="flex flex-row items-center justify-between gap-4 py-1 first:pt-0">
          <div className="flex items-center gap-2">
            <PiPlugsBold className="text-secondary" />
            <label className="text-sm font-medium text-secondary">
              Creator / Model / Provider
            </label>
          </div>
          <div className="flex gap-2">
            <Select value={selectedCreator} onValueChange={handleCreatorChange}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue placeholder="Creator" />
              </SelectTrigger>
              <SelectContent>
                {creators.map((creator) => (
                  <SelectItem key={creator} value={creator}>
                    {creator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={currentModelName || ""}
              onValueChange={handleModelChange}
            >
              <SelectTrigger className="w-36 h-8">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={parameters.provider as string}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger className="w-28 h-8">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Temperature */}
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

        {/* Max Tokens */}
        {maxTokens && (
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
                max={maxTokens}
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

        {/* Reasoning Effort */}
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
