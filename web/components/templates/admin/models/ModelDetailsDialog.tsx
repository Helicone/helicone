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
import type { Model } from "@helicone-package/cost/models";
import { CheckCircle, XCircle, DollarSign, Clock, GitBranch } from "lucide-react";

interface ModelDetailsDialogProps {
  model: Model | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelDetailsDialog({
  model,
  open,
  onOpenChange,
}: ModelDetailsDialogProps) {
  if (!model) return null;

  const availableProviders = Object.entries(model.providers).filter(
    ([_, p]) => p.available
  );
  const unavailableProviders = Object.entries(model.providers).filter(
    ([_, p]) => !p.available
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {model.baseModelId && (
              <GitBranch className="h-5 w-5 text-muted-foreground" />
            )}
            {model.metadata.displayName}
            {model.disabled && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                Disabled
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Small className="text-muted-foreground">Model ID</Small>
              <P className="font-mono">{model.id}</P>
            </div>

            {model.baseModelId && (
              <div>
                <Small className="text-muted-foreground">Base Model</Small>
                <P className="font-mono">{model.baseModelId}</P>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Small className="text-muted-foreground">Creator</Small>
                <P>{model.creator}</P>
              </div>
              <div>
                <Small className="text-muted-foreground">Context Window</Small>
                <P>{model.metadata.contextWindow.toLocaleString()} tokens</P>
              </div>
            </div>

            {model.metadata.description && (
              <div>
                <Small className="text-muted-foreground">Description</Small>
                <P>{model.metadata.description}</P>
              </div>
            )}

            {model.metadata.releaseDate && (
              <div>
                <Small className="text-muted-foreground">Release Date</Small>
                <P>{new Date(model.metadata.releaseDate).toLocaleDateString()}</P>
              </div>
            )}
          </div>

          {/* Provider Tabs */}
          <div>
            <H3 className="mb-4">Provider Information</H3>
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="available">
                  Available ({availableProviders.length})
                </TabsTrigger>
                <TabsTrigger value="unavailable">
                  Unavailable ({unavailableProviders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available" className="space-y-3 mt-4">
                {availableProviders.length === 0 ? (
                  <P className="text-muted-foreground text-center py-4">
                    No available providers
                  </P>
                ) : (
                  availableProviders.map(([key, provider]) => (
                    <Card key={key} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <P className="font-medium">{provider.provider}</P>
                            {provider.endpoint && (
                              <Small className="text-muted-foreground">
                                {provider.endpoint}
                              </Small>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3 w-3" />
                            <span>${provider.cost.prompt_token.toFixed(2)}</span>
                            <span className="text-muted-foreground">/ 1M prompt tokens</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <DollarSign className="h-3 w-3" />
                            <span>${provider.cost.completion_token.toFixed(2)}</span>
                            <span className="text-muted-foreground">/ 1M completion tokens</span>
                          </div>
                        </div>
                      </div>

                      {provider.rateLimit && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Rate Limits:</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                            {provider.rateLimit.rpm && (
                              <div>
                                <span className="text-muted-foreground">RPM:</span>{" "}
                                {provider.rateLimit.rpm.toLocaleString()}
                              </div>
                            )}
                            {provider.rateLimit.tpm && (
                              <div>
                                <span className="text-muted-foreground">TPM:</span>{" "}
                                {provider.rateLimit.tpm.toLocaleString()}
                              </div>
                            )}
                            {provider.rateLimit.rpd && (
                              <div>
                                <span className="text-muted-foreground">RPD:</span>{" "}
                                {provider.rateLimit.rpd.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="unavailable" className="space-y-3 mt-4">
                {unavailableProviders.length === 0 ? (
                  <P className="text-muted-foreground text-center py-4">
                    All providers are available
                  </P>
                ) : (
                  unavailableProviders.map(([key, provider]) => (
                    <Card key={key} className="p-4 opacity-60">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <P className="font-medium">{provider.provider}</P>
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