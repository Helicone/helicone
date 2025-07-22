import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import yaml from "js-yaml";
import useNotification from "@/components/shared/notification/useNotification";
import { useRouter } from "next/router";
import { InfoIcon, PlusIcon } from "lucide-react";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { H3, Small } from "@/components/ui/typography";
import FoldedHeader from "@/components/shared/FoldedHeader";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useOrg } from "@/components/layout/org/organizationContext";
import Link from "next/link";

const CreateRouterPage = () => {
  const org = useOrg();

  const { data: hasFeatureFlag } = useFeatureFlag(
    "ai_gateway",
    org?.currentOrg?.id ?? "",
  );

  const [name, setName] = useState("My Router");

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

  // Generated configuration visibility
  const [showGeneratedConfig, setShowGeneratedConfig] = useState(false);

  const queryClient = useQueryClient();
  const { setNotification } = useNotification();
  const router = useRouter();
  const { mutateAsync: createRouter, isPending } = $JAWN_API.useMutation(
    "post",
    "/v1/gateway",
  );

  const handleCreateRouter = async () => {
    if (!name) {
      setNotification("Router name is required", "error");
      return;
    }

    const generatedConfig = generateConfig();
    const obj = yaml.load(generatedConfig);

    try {
      const routerResponse = await createRouter({
        body: {
          name,
          config: JSON.stringify(obj),
        },
      });

      queryClient.invalidateQueries({ queryKey: ["get", "/v1/gateway"] });
      setNotification("Router created successfully", "success");

      // Redirect to the new router page
      router.push(
        `/gateway/${routerResponse?.data?.routerHash}?new-router=true`,
      );
    } catch (error) {
      setNotification("Failed to create router", "error");
      console.error("Error creating router:", error);
    }
  };

  const generateConfig = () => {
    const configObj: Record<string, unknown> = {};

    // Load balancing configuration (always enabled)
    configObj["load-balance"] = {
      chat: {
        strategy: "model-latency",
        models: ["openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet"],
      },
    };

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
  const getLoadBalanceSummary = () => {
    return "model-latency • 2 models";
  };

  const getCacheSummary = () => {
    if (!enableCache) return "Disabled";
    return `${cacheDirective} • ${cacheBuckets} Buckets • ${cacheSeed.length > 10 ? cacheSeed.slice(0, 10) + "..." : cacheSeed} Seed`;
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

  if (!hasFeatureFlag) {
    return <div>You do not have access to the AI Gateway</div>;
  }

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <FoldedHeader
        showFold={false}
        leftSection={
          <Link href="/gateway">
            <Small className="font-bold text-gray-500 dark:text-slate-300">
              AI Gateway
            </Small>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div>
          <H3>Create Router</H3>
          <Small className="mb-4 text-muted-foreground">
            Build a custom router with load balancing, caching, and rate
            limiting
          </Small>
          {/* Router Name Input */}
          <div className="space-y-2 py-2">
            <Label htmlFor="name">Router Name</Label>
            <Input
              id="name"
              placeholder="My Router"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-lg"
            />
            <div className="flex w-full items-center justify-end gap-1 text-xs text-muted-foreground">
              <InfoIcon className="h-3 w-3" />
              For more information about the configuration, see the{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://docs.helicone.ai/ai-gateway/config"
                className="text-blue-500 hover:underline"
              >
                documentation
              </a>
            </div>
          </div>

          {/* Configuration Accordion */}
          <Accordion
            type="multiple"
            className="w-full"
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
                    Make sure you've set up your provider keys in the{" "}
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
                      Load balancing is configured with model-latency strategy
                      and default models. You can edit the configuration after
                      creation.
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
                      checked={enableCache}
                      onCheckedChange={setEnableCache}
                    />
                  </div>

                  {enableCache && (
                    <>
                      <div className="grid items-start gap-1.5">
                        <Label className="justify-start">Cache Directive</Label>
                        <Input
                          value={cacheDirective}
                          onChange={(e) => setCacheDirective(e.target.value)}
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
                          onChange={(e) => setRateLimitCapacity(e.target.value)}
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
                          onValueChange={(value: "constant" | "exponential") =>
                            setRetryStrategy(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select strategy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="constant">Constant</SelectItem>
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
                              onChange={(e) => setConstantDelay(e.target.value)}
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
                              Default: 2.0 (each retry delay is multiplied by
                              this factor)
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

          {/* Generated Configuration Toggle */}
          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGeneratedConfig(!showGeneratedConfig)}
            >
              {showGeneratedConfig ? "Hide" : "View"} Generated Configuration
            </Button>
          </div>

          {/* Generated Configuration Section */}
          {showGeneratedConfig && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Generated Configuration
                </Label>
              </div>
              <div className="rounded-lg border bg-muted p-3">
                <MarkdownEditor
                  text={generateConfig()}
                  disabled
                  setText={() => {}}
                  language="yaml"
                  monaco
                  monacoOptions={{
                    tabSize: 2,
                    lineNumbers: "on",
                  }}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-end justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRouter}
              disabled={isPending || !name.trim()}
            >
              {isPending ? (
                "Creating..."
              ) : (
                <>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Router
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateRouterPage;
