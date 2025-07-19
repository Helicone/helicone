import MarkdownEditor from "@/components/shared/markdownEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";
import yaml from "js-yaml";
import useNotification from "@/components/shared/notification/useNotification";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const defaultConfig = `load-balance:
  chat:
    strategy: model-latency
    models:
      - openai/gpt-4o-mini
      - anthropic/claude-3-5-sonnet`;

const CreateRouterDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [name, setName] = useState("My Router");
  const [config, setConfig] = useState(defaultConfig);

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

  // Generated configuration visibility
  const [showGeneratedConfig, setShowGeneratedConfig] = useState(false);

  const queryClient = useQueryClient();
  const { setNotification } = useNotification();
  const { mutate: createRouter } = $JAWN_API.useMutation(
    "post",
    "/v1/gateway",
    {
      onSuccess: () => {
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["get", "/v1/gateway"] });
        setNotification("Router created", "success");
      },
    },
  );

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
        capacity: parseInt(rateLimitCapacity),
        "refill-frequency": rateLimitRefillFrequency,
      };
    }

    return yaml.dump(configObj);
  };

  const handleSubmit = () => {
    if (!name) {
      return;
    }

    const generatedConfig = generateConfig();
    const obj = yaml.load(generatedConfig);

    createRouter({
      body: {
        name,
        config: JSON.stringify(obj),
      },
    });
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4" />
          Create Router
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-2 max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Router</DialogTitle>
          <DialogDescription>
            Build a custom router with load balancing, caching, and rate
            limiting
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Router Name Input */}
          <div className="flex flex-col gap-1">
            <div className="grid items-start gap-1.5">
              <Label htmlFor="name" className="justify-start">
                Router Name
              </Label>
              <Input
                id="name"
                placeholder="My Router"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Configuration Documentation Link */}
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
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="load-balance">
              <AccordionTrigger className="flex items-center justify-between rounded-md transition-colors hover:bg-muted/50 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span>Load Balancing</span>
                  <Badge variant="secondary" className="text-xs">
                    {getLoadBalanceSummary()}
                  </Badge>
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
          </Accordion>

          {/* Generated Configuration Toggle */}
          <div className="flex justify-center">
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
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Create Router</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRouterDialog;
