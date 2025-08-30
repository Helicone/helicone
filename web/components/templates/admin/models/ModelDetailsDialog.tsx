import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { H3, P, Small } from "@/components/ui/typography";
import type {
  ModelConfig as Model,
  Endpoint as ModelEndpoint,
} from "@helicone-package/cost/models/types";
import { CheckCircle, XCircle, Clock, Globe } from "lucide-react";

interface ModelDetailsDialogProps {
  model: Model | null;
  modelKey: string;
  endpoints: ModelEndpoint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelDetailsDialog({
  model,
  modelKey,
  endpoints,
  open,
  onOpenChange,
}: ModelDetailsDialogProps) {
  if (!model) return null;

  // For now, all endpoints are considered available since we removed status
  const availableEndpoints = endpoints;
  const unavailableEndpoints: ModelEndpoint[] = [];

  // Group endpoints by provider
  const endpointsByProvider = availableEndpoints.reduce(
    (acc, endpoint) => {
      if (!acc[endpoint.provider]) {
        acc[endpoint.provider] = [];
      }
      acc[endpoint.provider].push(endpoint);
      return acc;
    },
    {} as Record<string, ModelEndpoint[]>,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {model.name}
            {endpoints.length === 0 && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
              >
                No Endpoints
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Small className="text-muted-foreground">Model ID</Small>
              <P className="font-mono">{modelKey}</P>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Small className="text-muted-foreground">Author</Small>
                <P>{model.author}</P>
              </div>
              <div>
                <Small className="text-muted-foreground">Context Window</Small>
                <P>{model.contextLength.toLocaleString()} tokens</P>
              </div>
            </div>

            {model.maxOutputTokens && (
              <div>
                <Small className="text-muted-foreground">
                  Max Output Tokens
                </Small>
                <P>{model.maxOutputTokens.toLocaleString()} tokens</P>
              </div>
            )}

            {model.description && (
              <div>
                <Small className="text-muted-foreground">Description</Small>
                <P className="text-sm">{model.description}</P>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Small className="text-muted-foreground">Modality</Small>
                <P>
                  {model.modality.inputs.join(", ")} →{" "}
                  {model.modality.outputs.join(", ")}
                </P>
              </div>
              <div>
                <Small className="text-muted-foreground">Tokenizer</Small>
                <P>{model.tokenizer}</P>
              </div>
            </div>

            {model.created && (
              <div>
                <Small className="text-muted-foreground">Created</Small>
                <P>{new Date(model.created).toLocaleDateString()}</P>
              </div>
            )}
          </div>

          {/* Endpoint Tabs */}
          <div>
            <H3 className="mb-4">Endpoint Information</H3>
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="available">
                  Available ({availableEndpoints.length})
                </TabsTrigger>
                <TabsTrigger value="unavailable">
                  Unavailable ({unavailableEndpoints.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="mt-4 space-y-3">
                {availableEndpoints.length === 0 ? (
                  <P className="py-4 text-center text-muted-foreground">
                    No available endpoints
                  </P>
                ) : (
                  Object.entries(endpointsByProvider).map(
                    ([provider, providerEndpoints]) => (
                      <div key={provider} className="space-y-2">
                        <Small className="font-medium text-muted-foreground">
                          {provider} ({providerEndpoints.length} endpoint
                          {providerEndpoints.length > 1 ? "s" : ""})
                        </Small>
                        {providerEndpoints.map((endpoint, idx) => (
                          <Card key={`${provider}-${idx}`} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <div>
                                  <P className="font-medium">
                                    {endpoint.providerModelId}
                                  </P>
                                  <div className="mt-1 flex items-center gap-2">
                                    <Globe className="h-3 w-3 text-muted-foreground" />
                                    <Small className="font-mono text-muted-foreground">
                                      {"default"}
                                    </Small>
                                  </div>
                                </div>
                              </div>

                              {/* Pricing tiers table */}
                              {endpoint.pricing.length > 0 && (
                                <div className="ml-6">
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="font-medium text-muted-foreground">
                                      Tier
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                      Input Price
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                      Output Price
                                    </div>

                                    {endpoint.pricing.map((tier, tierIdx) => (
                                      <>
                                        <div
                                          key={`tier-${tierIdx}`}
                                          className="text-muted-foreground"
                                        >
                                          {tierIdx === 0 &&
                                          endpoint.pricing.length > 1 ? (
                                            <span>
                                              ≤
                                              {endpoint.pricing[1]?.threshold >=
                                              1000000
                                                ? `${(endpoint.pricing[1]?.threshold / 1000000).toFixed(0)}M`
                                                : `${(endpoint.pricing[1]?.threshold / 1000).toFixed(0)}K`}
                                            </span>
                                          ) : tier.threshold > 0 ? (
                                            <span>
                                              &gt;
                                              {tier.threshold >= 1000000
                                                ? `${(tier.threshold / 1000000).toFixed(0)}M`
                                                : `${(tier.threshold / 1000).toFixed(0)}K`}
                                            </span>
                                          ) : (
                                            <span>Base</span>
                                          )}
                                        </div>
                                        <div key={`input-${tierIdx}`}>
                                          $
                                          {(
                                            (tier.input ?? 0) * 1000000
                                          ).toFixed(2)}
                                        </div>
                                        <div key={`output-${tierIdx}`}>
                                          $
                                          {(
                                            (tier.output ?? 0) * 1000000
                                          ).toFixed(2)}
                                        </div>
                                      </>
                                    ))}
                                  </div>

                                  {/* Additional prices for first tier */}
                                  {(() => {
                                    const tier = endpoint.pricing[0];
                                    if (!tier) return null;

                                    const additionalPrices = [];

                                    if (tier.cacheMultipliers?.read) {
                                      additionalPrices.push({
                                        label: "Cache Read",
                                        value: `$${(tier.input * tier.cacheMultipliers.read * 1000000).toFixed(2)}`,
                                      });
                                    }
                                    if (tier.cacheMultipliers?.write5m) {
                                      additionalPrices.push({
                                        label: "Cache Write",
                                        value: `$${(tier.input * tier.cacheMultipliers.write5m * 1000000).toFixed(2)}`,
                                      });
                                    }
                                    if (tier.audio) {
                                      additionalPrices.push({
                                        label: "Input Audio",
                                        value:
                                          tier.audio === -1
                                            ? "--"
                                            : `$${(tier.audio * 1000000).toFixed(2)}`,
                                      });
                                    }
                                    if (tier.thinking) {
                                      additionalPrices.push({
                                        label: "Thinking",
                                        value: `$${(tier.thinking * 1000000).toFixed(2)}`,
                                      });
                                    }

                                    if (additionalPrices.length === 0)
                                      return null;

                                    return (
                                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                                        {additionalPrices.map((price, idx) => (
                                          <div key={idx}>
                                            <span className="text-xs">
                                              {price.label}:
                                            </span>{" "}
                                            {price.value}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>

                            {/* Context and limits */}
                            {(endpoint.contextLength !== model.contextLength ||
                              endpoint.maxCompletionTokens) && (
                              <div className="mt-3 border-t pt-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>Limits:</span>
                                </div>
                                <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                                  {endpoint.contextLength !==
                                    model.contextLength && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Context:
                                      </span>{" "}
                                      {endpoint.contextLength.toLocaleString()}
                                    </div>
                                  )}
                                  {endpoint.maxCompletionTokens && (
                                    <div>
                                      <span className="text-muted-foreground">
                                        Max Output:
                                      </span>{" "}
                                      {endpoint.maxCompletionTokens.toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Supported parameters */}
                            {endpoint.supportedParameters.length > 0 && (
                              <div className="mt-3 border-t pt-3">
                                <Small className="text-muted-foreground">
                                  Supported Parameters:
                                </Small>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {endpoint.supportedParameters
                                    .slice(0, 8)
                                    .map((param) => (
                                      <Badge
                                        key={param}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {param}
                                      </Badge>
                                    ))}
                                  {endpoint.supportedParameters.length > 8 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      +{endpoint.supportedParameters.length - 8}{" "}
                                      more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    ),
                  )
                )}
              </TabsContent>

              <TabsContent value="unavailable" className="mt-4 space-y-3">
                {unavailableEndpoints.length === 0 ? (
                  <P className="py-4 text-center text-muted-foreground">
                    All endpoints are available
                  </P>
                ) : (
                  unavailableEndpoints.map((endpoint, idx) => (
                    <Card key={idx} className="p-4 opacity-60">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <div>
                          <P className="font-medium">
                            {endpoint.providerModelId}
                          </P>
                          <Small className="font-mono text-muted-foreground">
                            {"default"}
                          </Small>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
