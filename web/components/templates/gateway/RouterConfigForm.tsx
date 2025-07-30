import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { InfoIcon, PlusIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Discriminated union for load balance inner configuration
type LoadBalance =
  | { type: "model-latency"; inner: string[] }
  | { type: "model-weighted"; inner: { model: string; weight: number }[] }
  | { type: "provider-weighted"; inner: { provider: string; weight: number }[] }
  | { type: "provider-latency"; inner: string[] };

export interface RouterConfigFormState {
  loadBalance: LoadBalance;

  // Cache configuration
  enableCache: boolean;
  cacheDirective: string;
  cacheBuckets: string;
  cacheSeed: string;

  // Rate limiting configuration
  enableRateLimit: boolean;
  rateLimitCapacity: string;
  rateLimitRefillFrequency: string;

  // Retries configuration
  enableRetries: boolean;
  retryStrategy: "constant" | "exponential";
  constantDelay: string;
  constantMaxRetries: string;
  exponentialMinDelay: string;
  exponentialMaxDelay: string;
  exponentialMaxRetries: string;
  exponentialFactor: string;

  // Load balance configuration (for create mode)
  loadBalanceConfig?: Record<string, unknown>;
}

interface RouterConfigFormProps {
  state: RouterConfigFormState;
  onStateChange: (_state: RouterConfigFormState) => void;
  mode?: "create" | "edit";
}

const RouterConfigForm = ({ state, onStateChange }: RouterConfigFormProps) => {
  const [modelInput, setModelInput] = useState("");
  const [weightedModelInput, setWeightedModelInput] = useState("");
  const [weightInput, setWeightInput] = useState("");

  const updateState = (updates: Partial<RouterConfigFormState>) => {
    onStateChange({ ...state, ...updates });
  };

  // Helper function to add a model to the list
  const addModel = (model: string) => {
    const trimmedModel = model.trim();
    if (trimmedModel && state.loadBalance.type === "model-latency") {
      const currentModels = state.loadBalance.inner;
      if (!currentModels.includes(trimmedModel)) {
        updateState({
          loadBalance: {
            type: "model-latency",
            inner: [...currentModels, trimmedModel],
          },
        });
      }
      setModelInput("");
    }
  };

  // Helper function to remove a model from the list
  const removeModel = (modelToRemove: string) => {
    if (state.loadBalance.type === "model-latency") {
      updateState({
        loadBalance: {
          type: "model-latency",
          inner: state.loadBalance.inner.filter(
            (model) => model !== modelToRemove,
          ),
        },
      });
    }
  };

  const modelWeightedInputRef = useRef<HTMLInputElement>(null);

  // Helper function to add a weighted model to the list
  const addWeightedModel = () => {
    const trimmedModel = weightedModelInput.trim();
    const weight = parseFloat(weightInput);

    if (
      trimmedModel &&
      !isNaN(weight) &&
      weight > 0 &&
      state.loadBalance.type === "model-weighted"
    ) {
      const currentModels = state.loadBalance.inner as {
        model: string;
        weight: number;
      }[];
      const modelExists = currentModels.some(
        (item) => item.model === trimmedModel,
      );

      if (!modelExists) {
        updateState({
          loadBalance: {
            type: "model-weighted",
            inner: [...currentModels, { model: trimmedModel, weight }],
          },
        });
        setWeightedModelInput("");
        setWeightInput("");
        modelWeightedInputRef.current?.focus();
      }
    }
  };

  // Helper function to remove a weighted model from the list
  const removeWeightedModel = (modelToRemove: string) => {
    if (state.loadBalance.type === "model-weighted") {
      const currentModels = state.loadBalance.inner as {
        model: string;
        weight: number;
      }[];
      updateState({
        loadBalance: {
          type: "model-weighted",
          inner: currentModels.filter((item) => item.model !== modelToRemove),
        },
      });
    }
  };

  // Handle input key press
  const handleModelInputKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addModel(modelInput);
    }
  };

  // Handle input change
  const handleModelInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModelInput(e.target.value);
  };

  // Handle weighted model input change
  const handleWeightedModelInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setWeightedModelInput(e.target.value);
  };

  // Handle weight input change
  const handleWeightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeightInput(e.target.value);
  };

  // Helper functions to get compact summaries
  const getLoadBalanceSummary = () => {
    return `${state.loadBalance.type} • ${state.loadBalance.inner.length} ${state.loadBalance.type.includes("model") ? "model" : "provider"}${state.loadBalance.inner.length > 1 ? "s" : ""}`;
  };

  const getCacheSummary = () => {
    if (!state.enableCache) return "Disabled";
    return `${
      state.cacheDirective && state.cacheDirective.length > 20
        ? `${state.cacheDirective.slice(0, 20)}...`
        : state.cacheDirective
    } • ${state.cacheBuckets} Buckets`;
  };

  const getRateLimitSummary = () => {
    if (!state.enableRateLimit) return "Disabled";
    return `Per API Key • ${state.rateLimitCapacity}/${state.rateLimitRefillFrequency}`;
  };

  const getRetriesSummary = () => {
    if (!state.enableRetries) return "Disabled";
    if (state.retryStrategy === "constant") {
      return `Constant • ${state.constantDelay} • ${state.constantMaxRetries} retries`;
    } else {
      return `Exponential • ${state.exponentialMinDelay}-${state.exponentialMaxDelay} • ${state.exponentialMaxRetries} retries`;
    }
  };

  return (
    <Accordion
      type="multiple"
      defaultValue={["load-balance", "cache", "rate-limit", "retries"]}
    >
      <AccordionItem value="load-balance">
        <AccordionTrigger className="flex items-center justify-between rounded-md transition-colors hover:bg-muted/50 hover:no-underline">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span>Load Balancing</span>
              <Badge variant="secondary" className="text-xs">
                {getLoadBalanceSummary()}
              </Badge>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Make sure you&apos;ve set up your provider keys in the{" "}
              <Link href="/providers" className="text-blue-500 hover:underline">
                providers
              </Link>{" "}
              section.
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="grid items-start gap-1.5">
              <Label className="justify-start">Strategy</Label>
              <Select
                value={state.loadBalance.type}
                onValueChange={(value: "model-latency" | "model-weighted") => {
                  // Reset input when strategy changes
                  setModelInput("");

                  // Create appropriate load balance config based on strategy
                  let newLoadBalance: LoadBalance;
                  switch (value) {
                    case "model-latency":
                      newLoadBalance = {
                        type: "model-latency",
                        inner: [],
                      };
                      break;
                    case "model-weighted":
                      newLoadBalance = {
                        type: "model-weighted",
                        inner: [],
                      };
                      break;
                    default:
                      newLoadBalance = {
                        type: "model-latency",
                        inner: [],
                      };
                  }

                  updateState({
                    loadBalance: newLoadBalance,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="model-latency">Model Latency</SelectItem>
                  <SelectItem value="model-weighted">Model Weighted</SelectItem>
                  {state.loadBalance.type === "provider-weighted" && (
                    <SelectItem value="provider-weighted">
                      Provider Weighted
                    </SelectItem>
                  )}
                  {state.loadBalance.type === "provider-latency" && (
                    <SelectItem value="provider-latency">
                      Provider Latency
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {state.loadBalance.type === "model-latency" && (
              <div className="grid items-start gap-1.5">
                <Label className="justify-start">Models</Label>
                <Input
                  value={modelInput}
                  onChange={handleModelInputChange}
                  onKeyDown={handleModelInputKeyPress}
                  placeholder="openai/gpt-4o-mini, anthropic/claude-3-5-sonnet"
                />
                <p className="text-xs text-muted-foreground">
                  Press Enter or comma to add a model. Click on badges to remove
                  them.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {state.loadBalance.inner.map((model, index) => (
                    <Badge
                      key={index}
                      variant="helicone"
                      className="cursor-pointer text-xs transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeModel(model)}
                      title="Click to remove"
                    >
                      {model} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {state.loadBalance.type === "model-weighted" && (
              <div className="grid items-start gap-1.5">
                <Label className="justify-start">Models</Label>
                <div className="flex gap-2">
                  <Input
                    ref={modelWeightedInputRef}
                    value={weightedModelInput}
                    onChange={handleWeightedModelInputChange}
                    placeholder="openai/gpt-4o-mini"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (
                          weightInput.trim() !== "" &&
                          weightedModelInput.trim() !== ""
                        ) {
                          addWeightedModel();
                        }
                      }
                    }}
                  />
                  <div className="w-20">
                    <Input
                      type="number"
                      value={weightInput}
                      onChange={handleWeightInputChange}
                      placeholder="1.0"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (
                            weightInput.trim() !== "" &&
                            weightedModelInput.trim() !== ""
                          ) {
                            addWeightedModel();
                          }
                        }
                      }}
                    />
                  </div>
                  <Button
                    size="icon"
                    onClick={addWeightedModel}
                    className="h-8 w-8"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                  {/* <button
                    type="button"
                    onClick={addWeightedModel}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                  >
                    Add
                  </button> */}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter model name and weight, then click Add. Click on badges
                  to remove them.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(
                    state.loadBalance.inner as {
                      model: string;
                      weight: number;
                    }[]
                  ).map((item, index) => (
                    <Badge
                      key={index}
                      variant="helicone"
                      className="cursor-pointer text-xs transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeWeightedModel(item.model)}
                      title="Click to remove"
                    >
                      {item.model} ({item.weight}) ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(state.loadBalance.type === "provider-weighted" ||
              state.loadBalance.type === "provider-latency") && (
              <div className="grid items-start gap-1.5">
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle>
                    We don&apos;t support provider-weighted or provider-latency
                    on the UI yet.
                  </AlertTitle>
                  <AlertDescription>
                    You can edit the config manually in the YAML editor.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Cache Configuration */}
      <AccordionItem value="cache">
        <AccordionTrigger className="flex items-center justify-between rounded-md transition-colors hover:bg-muted/50 hover:no-underline">
          <div className="flex items-center gap-2">
            <span>Caching</span>
            <Badge variant="secondary" className="text-xs">
              {getCacheSummary()}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="justify-start">Enable Caching</Label>
                <p className="text-sm text-muted-foreground">
                  Configure response caching
                </p>
              </div>
              <Switch
                checked={state.enableCache}
                onCheckedChange={(checked) =>
                  updateState({ enableCache: checked })
                }
              />
            </div>

            {state.enableCache && (
              <>
                <div className="grid items-start gap-1.5">
                  <Label className="justify-start">Cache Directive</Label>
                  <Input
                    value={state.cacheDirective}
                    onChange={(e) =>
                      updateState({ cacheDirective: e.target.value })
                    }
                    placeholder="max-age=3600, max-stale=1800"
                  />
                </div>

                <div className="grid items-start gap-1.5">
                  <Label className="justify-start">Buckets</Label>
                  <Input
                    type="number"
                    value={state.cacheBuckets}
                    onChange={(e) =>
                      updateState({ cacheBuckets: e.target.value })
                    }
                    placeholder="10"
                  />
                </div>

                <div className="grid items-start gap-1.5">
                  <Label className="justify-start">Seed</Label>
                  <Input
                    value={state.cacheSeed}
                    onChange={(e) => updateState({ cacheSeed: e.target.value })}
                    placeholder="unique-cache-seed"
                  />
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Rate Limiting Configuration */}
      <AccordionItem value="rate-limit">
        <AccordionTrigger className="flex items-center justify-between rounded-md transition-colors hover:bg-muted/50 hover:no-underline">
          <div className="flex items-center gap-2">
            <span>Rate Limiting</span>
            <Badge variant="secondary" className="text-xs">
              {getRateLimitSummary()}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="justify-start">Enable Rate Limiting</Label>
                <p className="text-sm text-muted-foreground">
                  Configure request rate limiting
                </p>
              </div>
              <Switch
                checked={state.enableRateLimit}
                onCheckedChange={(checked) =>
                  updateState({ enableRateLimit: checked })
                }
              />
            </div>

            {state.enableRateLimit && (
              <>
                <div className="grid items-start gap-1.5">
                  <Label className="justify-start">Capacity</Label>
                  <Input
                    type="number"
                    value={state.rateLimitCapacity}
                    onChange={(e) =>
                      updateState({ rateLimitCapacity: e.target.value })
                    }
                    placeholder="1000"
                  />
                </div>

                <div className="grid items-start gap-1.5">
                  <Label className="justify-start">Refill Frequency</Label>
                  <Input
                    value={state.rateLimitRefillFrequency}
                    onChange={(e) =>
                      updateState({ rateLimitRefillFrequency: e.target.value })
                    }
                    placeholder="10s"
                  />
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Retries Configuration */}
      <AccordionItem value="retries">
        <AccordionTrigger className="flex items-center justify-between rounded-md transition-colors hover:bg-muted/50 hover:no-underline">
          <div className="flex items-center gap-2">
            <span>Retries</span>
            <Badge variant="secondary" className="text-xs">
              {getRetriesSummary()}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="justify-start">Enable Retries</Label>
                <p className="text-sm text-muted-foreground">
                  Configure automatic retry behavior for failed requests
                </p>
              </div>
              <Switch
                checked={state.enableRetries}
                onCheckedChange={(checked) =>
                  updateState({ enableRetries: checked })
                }
              />
            </div>

            {state.enableRetries && (
              <>
                <div className="grid items-start gap-1.5">
                  <Label className="justify-start">Strategy</Label>
                  <Select
                    value={state.retryStrategy}
                    onValueChange={(value: "constant" | "exponential") =>
                      updateState({ retryStrategy: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="constant">Constant</SelectItem>
                      <SelectItem value="exponential">Exponential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {state.retryStrategy === "constant" && (
                  <>
                    <div className="grid items-start gap-1.5">
                      <Label className="justify-start">Delay (optional)</Label>
                      <Input
                        value={state.constantDelay}
                        onChange={(e) =>
                          updateState({ constantDelay: e.target.value })
                        }
                        placeholder="1s"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 1s
                      </p>
                    </div>

                    <div className="grid items-start gap-1.5">
                      <Label className="justify-start">
                        Max Retries (optional)
                      </Label>
                      <Input
                        type="number"
                        value={state.constantMaxRetries}
                        onChange={(e) =>
                          updateState({ constantMaxRetries: e.target.value })
                        }
                        placeholder="2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 2
                      </p>
                    </div>
                  </>
                )}

                {state.retryStrategy === "exponential" && (
                  <>
                    <div className="grid items-start gap-1.5">
                      <Label className="justify-start">
                        Min Delay (optional)
                      </Label>
                      <Input
                        value={state.exponentialMinDelay}
                        onChange={(e) =>
                          updateState({ exponentialMinDelay: e.target.value })
                        }
                        placeholder="1s"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 1s
                      </p>
                    </div>

                    <div className="grid items-start gap-1.5">
                      <Label className="justify-start">
                        Max Delay (optional)
                      </Label>
                      <Input
                        value={state.exponentialMaxDelay}
                        onChange={(e) =>
                          updateState({ exponentialMaxDelay: e.target.value })
                        }
                        placeholder="30s"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 30s
                      </p>
                    </div>

                    <div className="grid items-start gap-1.5">
                      <Label className="justify-start">
                        Max Retries (optional)
                      </Label>
                      <Input
                        type="number"
                        value={state.exponentialMaxRetries}
                        onChange={(e) =>
                          updateState({ exponentialMaxRetries: e.target.value })
                        }
                        placeholder="2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 2
                      </p>
                    </div>

                    <div className="grid items-start gap-1.5">
                      <Label className="justify-start">Factor (optional)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={state.exponentialFactor}
                        onChange={(e) =>
                          updateState({ exponentialFactor: e.target.value })
                        }
                        placeholder="2.0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 2.0 (each retry delay is multiplied by this
                        factor)
                      </p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default RouterConfigForm;
