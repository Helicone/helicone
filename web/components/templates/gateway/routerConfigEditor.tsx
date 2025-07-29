import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import yaml from "js-yaml";
import { Loader2, Settings, Code2, FormInput } from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";
import ThemedDrawer from "@/components/shared/themed/themedDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Badge } from "@/components/ui/badge";
import MarkdownEditor from "@/components/shared/markdownEditor";
import useGatewayRouter from "./useGatewayRouter";

interface RouterConfigEditorProps {
  routerHash: string;
  gatewayRouter: any;
}

const RouterConfigEditor = ({
  routerHash,
  gatewayRouter,
}: RouterConfigEditorProps) => {
  const [config, setConfig] = useState<string>("");
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "yaml">("form");

  const [loadBalanceConfig, setLoadBalanceConfig] = useState<
    Record<string, unknown>
  >({});
  // Cache configuration
  const [enableCache, setEnableCache] = useState(false);
  const [cacheDirective, setCacheDirective] = useState(
    "max-age=3600, max-stale=1800",
  );
  const [cacheBuckets, setCacheBuckets] = useState("10");
  const [cacheSeed, setCacheSeed] = useState("unique-cache-seed");

  // Rate limiting configuration
  const [enableRateLimit, setEnableRateLimit] = useState(false);
  const [rateLimitCapacity, setRateLimitCapacity] = useState("1000");
  const [rateLimitRefillFrequency, setRateLimitFrequency] = useState("10s");

  // Retries configuration
  const [enableRetries, setEnableRetries] = useState(false);
  const [retryStrategy, setRetryStrategy] = useState<
    "constant" | "exponential"
  >("constant");
  const [constantDelay, setConstantDelay] = useState("100ms");
  const [constantMaxRetries, setConstantMaxRetries] = useState("2");
  const [exponentialMinDelay, setExponentialMinDelay] = useState("100ms");
  const [exponentialMaxDelay, setExponentialMaxDelay] = useState("30s");
  const [exponentialMaxRetries, setExponentialMaxRetries] = useState("2");
  const [exponentialFactor, setExponentialFactor] = useState("2.0");

  const { updateGatewayRouter, isUpdatingGatewayRouter, validateRouterConfig } =
    useGatewayRouter({ routerHash });
  const { setNotification } = useNotification();

  // Helper function to parse config and set form values
  const parseConfigToForm = (configObj: any) => {
    if (configObj["load-balance"]) {
      setLoadBalanceConfig(
        configObj["load-balance"] as Record<string, unknown>,
      );
    }
    // Cache configuration
    if (configObj.cache) {
      setEnableCache(true);
      setCacheDirective(
        configObj.cache.directive || "max-age=3600, max-stale=1800",
      );
      setCacheBuckets(String(configObj.cache.buckets || 10));
      setCacheSeed(configObj.cache.seed || "unique-cache-seed");
    } else {
      setEnableCache(false);
    }

    // Rate limiting configuration
    if (configObj["rate-limit"]?.["per-api-key"]) {
      setEnableRateLimit(true);
      setRateLimitCapacity(
        String(configObj["rate-limit"]["per-api-key"].capacity || 1000),
      );
      setRateLimitFrequency(
        configObj["rate-limit"]["per-api-key"]["refill-frequency"] || "10s",
      );
    } else {
      setEnableRateLimit(false);
    }

    // Retries configuration
    if (configObj.retries) {
      setEnableRetries(true);
      const strategy = configObj.retries.strategy || "constant";
      setRetryStrategy(strategy);

      if (strategy === "constant") {
        setConstantDelay(configObj.retries.delay || "100ms");
        setConstantMaxRetries(String(configObj.retries["max-retries"] || 2));
      } else if (strategy === "exponential") {
        setExponentialMinDelay(configObj.retries["min-delay"] || "100ms");
        setExponentialMaxDelay(configObj.retries["max-delay"] || "30s");
        setExponentialMaxRetries(String(configObj.retries["max-retries"] || 2));
        setExponentialFactor(String(configObj.retries.factor || 2.0));
      }
    } else {
      setEnableRetries(false);
    }
  };

  // Helper function to generate config from form values
  const generateConfigFromForm = () => {
    const configObj: Record<string, unknown> = {};

    // Always include existing configuration that we don't modify
    if (loadBalanceConfig) {
      configObj["load-balance"] = loadBalanceConfig;
    }

    // Cache configuration
    if (enableCache) {
      configObj.cache = {
        directive: cacheDirective,
        buckets: parseInt(cacheBuckets),
        seed: cacheSeed,
      };
    }

    // Rate limiting configuration
    if (enableRateLimit) {
      configObj["rate-limit"] = {
        "per-api-key": {
          capacity: parseInt(rateLimitCapacity),
          "refill-frequency": rateLimitRefillFrequency,
        },
      };
    }

    // Retries configuration
    if (enableRetries) {
      const retryConfig: Record<string, unknown> = {
        strategy: retryStrategy,
      };

      if (retryStrategy === "constant") {
        if (constantDelay) retryConfig.delay = constantDelay;
        if (constantMaxRetries)
          retryConfig["max-retries"] = parseInt(constantMaxRetries);
      } else if (retryStrategy === "exponential") {
        if (exponentialMinDelay) retryConfig["min-delay"] = exponentialMinDelay;
        if (exponentialMaxDelay) retryConfig["max-delay"] = exponentialMaxDelay;
        if (exponentialMaxRetries)
          retryConfig["max-retries"] = parseInt(exponentialMaxRetries);
        if (exponentialFactor)
          retryConfig.factor = parseFloat(exponentialFactor);
      }

      configObj.retries = retryConfig;
    }

    return yaml.dump(configObj);
  };

  // Helper functions to get compact summaries
  const getCacheSummary = () => {
    if (!enableCache) return "Disabled";
    return `${cacheDirective.slice(0, 20)}... • ${cacheBuckets} Buckets`;
  };

  const getRateLimitSummary = () => {
    if (!enableRateLimit) return "Disabled";
    return `Per API Key • ${rateLimitCapacity}/${rateLimitRefillFrequency}`;
  };

  const getRetriesSummary = () => {
    if (!enableRetries) return "Disabled";
    if (retryStrategy === "constant") {
      return `Constant • ${constantDelay} • ${constantMaxRetries} retries`;
    } else {
      return `Exponential • ${exponentialMinDelay}-${exponentialMaxDelay} • ${exponentialMaxRetries} retries`;
    }
  };

  useEffect(() => {
    if (gatewayRouter) {
      const yamlString = yaml.dump(gatewayRouter.data?.config);
      setConfig(yamlString);
      parseConfigToForm(gatewayRouter.data?.config);
    }
  }, [gatewayRouter]);

  const handleConfigSave = async () => {
    let obj;

    if (activeTab === "form") {
      // Generate config from form values
      const generatedYaml = generateConfigFromForm();
      obj = yaml.load(generatedYaml);
    } else {
      // Use the YAML editor content
      obj = yaml.load(config);
    }

    const result = await validateRouterConfig(obj);
    if (!result.valid || result.error) {
      setNotification("Invalid router config", "error");
      return;
    }

    updateGatewayRouter({
      params: {
        path: {
          routerHash: routerHash,
        },
      },
      body: {
        name: gatewayRouter?.data?.name ?? "",
        config: JSON.stringify(obj),
      },
    });

    setConfigModalOpen(false);
    setNotification("Configuration saved successfully", "success");
  };

  // Sync form values to YAML when switching tabs
  const handleTabChange = (value: string) => {
    if (value === "yaml" && activeTab === "form") {
      // Generate YAML from form values
      setConfig(generateConfigFromForm());
    } else if (value === "form" && activeTab === "yaml") {
      // Parse YAML to form values
      try {
        const obj = yaml.load(config);
        parseConfigToForm(obj);
      } catch (e) {
        setNotification("Invalid YAML format", "error");
      }
    }
    setActiveTab(value as "form" | "yaml");
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfigModalOpen(true)}
      >
        <Settings className="mr-2 h-4 w-4" />
        Configuration
      </Button>
      <ThemedDrawer
        open={configModalOpen}
        setOpen={setConfigModalOpen}
        defaultWidth="w-[80vw]"
        defaultExpanded={true}
        actions={
          <div className="flex w-full flex-row items-center justify-between">
            <div className="text-lg font-semibold">Router Configuration</div>
            <div className="flex h-12 flex-row items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setConfigModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={isUpdatingGatewayRouter}
                onClick={handleConfigSave}
              >
                {isUpdatingGatewayRouter ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Configuration"
                )}
              </Button>
            </div>
          </div>
        }
      >
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="h-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              Form Editor
            </TabsTrigger>
            <TabsTrigger value="yaml" className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              YAML Editor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-4 max-h-full overflow-y-auto">
            <div className="space-y-4">
              <Accordion
                type="multiple"
                defaultValue={["cache", "rate-limit", "retries"]}
              >
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
                          <Label className="justify-start">
                            Enable Caching
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Configure response caching
                          </p>
                        </div>
                        <Switch
                          checked={enableCache}
                          onCheckedChange={setEnableCache}
                        />
                      </div>

                      {enableCache && (
                        <>
                          <div className="grid items-start gap-1.5">
                            <Label className="justify-start">
                              Cache Directive
                            </Label>
                            <Input
                              value={cacheDirective}
                              onChange={(e) =>
                                setCacheDirective(e.target.value)
                              }
                              placeholder="max-age=3600, max-stale=1800"
                            />
                          </div>

                          <div className="grid items-start gap-1.5">
                            <Label className="justify-start">Buckets</Label>
                            <Input
                              type="number"
                              value={cacheBuckets}
                              onChange={(e) => setCacheBuckets(e.target.value)}
                              placeholder="10"
                            />
                          </div>

                          <div className="grid items-start gap-1.5">
                            <Label className="justify-start">Seed</Label>
                            <Input
                              value={cacheSeed}
                              onChange={(e) => setCacheSeed(e.target.value)}
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
                          <Label className="justify-start">
                            Enable Rate Limiting
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Configure request rate limiting
                          </p>
                        </div>
                        <Switch
                          checked={enableRateLimit}
                          onCheckedChange={setEnableRateLimit}
                        />
                      </div>

                      {enableRateLimit && (
                        <>
                          <div className="grid items-start gap-1.5">
                            <Label className="justify-start">Capacity</Label>
                            <Input
                              type="number"
                              value={rateLimitCapacity}
                              onChange={(e) =>
                                setRateLimitCapacity(e.target.value)
                              }
                              placeholder="1000"
                            />
                          </div>

                          <div className="grid items-start gap-1.5">
                            <Label className="justify-start">
                              Refill Frequency
                            </Label>
                            <Input
                              value={rateLimitRefillFrequency}
                              onChange={(e) =>
                                setRateLimitFrequency(e.target.value)
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
                          <Label className="justify-start">
                            Enable Retries
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Configure automatic retry behavior for failed
                            requests
                          </p>
                        </div>
                        <Switch
                          checked={enableRetries}
                          onCheckedChange={setEnableRetries}
                        />
                      </div>

                      {enableRetries && (
                        <>
                          <div className="grid items-start gap-1.5">
                            <Label className="justify-start">Strategy</Label>
                            <Select
                              value={retryStrategy}
                              onValueChange={(
                                value: "constant" | "exponential",
                              ) => setRetryStrategy(value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select strategy" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="constant">
                                  Constant
                                </SelectItem>
                                <SelectItem value="exponential">
                                  Exponential
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {retryStrategy === "constant" && (
                            <>
                              <div className="grid items-start gap-1.5">
                                <Label className="justify-start">
                                  Delay (optional)
                                </Label>
                                <Input
                                  value={constantDelay}
                                  onChange={(e) =>
                                    setConstantDelay(e.target.value)
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
                                  value={constantMaxRetries}
                                  onChange={(e) =>
                                    setConstantMaxRetries(e.target.value)
                                  }
                                  placeholder="2"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Default: 2
                                </p>
                              </div>
                            </>
                          )}

                          {retryStrategy === "exponential" && (
                            <>
                              <div className="grid items-start gap-1.5">
                                <Label className="justify-start">
                                  Min Delay (optional)
                                </Label>
                                <Input
                                  value={exponentialMinDelay}
                                  onChange={(e) =>
                                    setExponentialMinDelay(e.target.value)
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
                                  value={exponentialMaxDelay}
                                  onChange={(e) =>
                                    setExponentialMaxDelay(e.target.value)
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
                                  value={exponentialMaxRetries}
                                  onChange={(e) =>
                                    setExponentialMaxRetries(e.target.value)
                                  }
                                  placeholder="2"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Default: 2
                                </p>
                              </div>

                              <div className="grid items-start gap-1.5">
                                <Label className="justify-start">
                                  Factor (optional)
                                </Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={exponentialFactor}
                                  onChange={(e) =>
                                    setExponentialFactor(e.target.value)
                                  }
                                  placeholder="2.0"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Default: 2.0 (each retry delay is multiplied
                                  by this factor)
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
            </div>
          </TabsContent>

          <TabsContent value="yaml" className="mt-4">
            <div className="h-[400px]">
              <MarkdownEditor
                monaco
                text={config}
                setText={(value) => setConfig(value)}
                disabled={false}
                language="yaml"
                monacoOptions={{
                  lineNumbers: "on",
                  tabSize: 2,
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </ThemedDrawer>
    </>
  );
};

export default RouterConfigEditor;
