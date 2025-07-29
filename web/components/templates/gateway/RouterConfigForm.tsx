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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import Link from "next/link";

export interface RouterConfigFormState {
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
  onStateChange: (state: RouterConfigFormState) => void;
  mode: "create" | "edit";
  showLoadBalance?: boolean;
}

const RouterConfigForm = ({
  state,
  onStateChange,
  mode,
  showLoadBalance = false,
}: RouterConfigFormProps) => {
  const updateState = (updates: Partial<RouterConfigFormState>) => {
    onStateChange({ ...state, ...updates });
  };

  // Helper functions to get compact summaries
  const getLoadBalanceSummary = () => {
    return "model-latency • 2 models";
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
      defaultValue={
        showLoadBalance
          ? ["load-balance", "cache", "rate-limit", "retries"]
          : ["cache", "rate-limit", "retries"]
      }
    >
      {/* Load Balance Configuration (only for create mode) */}
      {showLoadBalance && (
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
                <Link
                  href="/providers"
                  className="text-blue-500 hover:underline"
                >
                  providers
                </Link>{" "}
                section.
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Load balancing is configured with model-latency strategy and
                  default models. You can edit the configuration after creation.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border bg-muted p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Strategy</span>
                    <Badge variant="helicone">model-latency</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Models</span>
                    <div className="flex gap-1">
                      <Badge variant="helicone" className="text-xs">
                        openai/gpt-4o-mini
                      </Badge>
                      <Badge variant="helicone" className="text-xs">
                        anthropic/claude-3-5-sonnet
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

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
