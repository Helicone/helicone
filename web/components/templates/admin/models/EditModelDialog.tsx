import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Model } from "@helicone-package/cost/models";

// Helper function to format numbers with commas
const formatNumberWithCommas = (value: number | undefined): string => {
  if (value === undefined || value === null) return "";
  return value.toLocaleString();
};

// Helper function to parse number from comma-formatted string
const parseNumberFromString = (value: string): number | undefined => {
  if (!value) return undefined;
  const cleaned = value.replace(/,/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
};

interface EditModelDialogProps {
  model: Model | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (model: Model) => void;
}

export function EditModelDialog({
  model,
  open,
  onOpenChange,
  onSave,
}: EditModelDialogProps) {
  const [editedModel, setEditedModel] = useState<Model | null>(null);

  // Initialize edited model when dialog opens
  if (model && !editedModel && open) {
    setEditedModel(JSON.parse(JSON.stringify(model)));
  }

  if (!editedModel || !model) return null;

  const handleProviderCostChange = (
    provider: string,
    field: keyof (typeof editedModel.providers)[string]["cost"],
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    setEditedModel({
      ...editedModel,
      providers: {
        ...editedModel.providers,
        [provider]: {
          ...editedModel.providers[provider],
          cost: {
            ...editedModel.providers[provider].cost,
            [field]: numValue,
          },
        },
      },
    });
  };

  const handleRateLimitChange = (
    provider: string,
    field: "tpm" | "rpm" | "tpd" | "rpd",
    value: string,
  ) => {
    const numValue = parseNumberFromString(value);
    setEditedModel({
      ...editedModel,
      providers: {
        ...editedModel.providers,
        [provider]: {
          ...editedModel.providers[provider],
          rateLimit: {
            ...editedModel.providers[provider].rateLimit,
            [field]: numValue,
          },
        },
      },
    });
  };

  const handleProviderToggle = (provider: string, available: boolean) => {
    setEditedModel({
      ...editedModel,
      providers: {
        ...editedModel.providers,
        [provider]: {
          ...editedModel.providers[provider],
          available,
        },
      },
    });
  };

  const handleSave = () => {
    if (editedModel) {
      onSave(editedModel);
      onOpenChange(false);
      setEditedModel(null);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset to original model when closing without saving
      setEditedModel(model);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Model: {model.metadata.displayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="model-enabled" className="text-sm">
              Model enabled
            </Label>
            <Switch
              id="model-enabled"
              checked={!editedModel.disabled}
              onCheckedChange={(checked) =>
                setEditedModel({
                  ...editedModel,
                  disabled: !checked,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Model ID</Label>
              <Input value={editedModel.id} disabled />
            </div>
            <div>
              <Label>Creator</Label>
              <Input value={editedModel.creator} disabled />
            </div>
            <div>
              <Label>Context Window</Label>
              <Input
                type="text"
                value={formatNumberWithCommas(
                  editedModel.metadata.contextWindow,
                )}
                onChange={(e) =>
                  setEditedModel({
                    ...editedModel,
                    metadata: {
                      ...editedModel.metadata,
                      contextWindow: parseNumberFromString(e.target.value) || 0,
                    },
                  })
                }
              />
            </div>
            <div>
              <Label>Max Output Tokens</Label>
              <Input
                type="text"
                value={formatNumberWithCommas(
                  editedModel.metadata.maxOutputTokens,
                )}
                placeholder="Optional"
                onChange={(e) =>
                  setEditedModel({
                    ...editedModel,
                    metadata: {
                      ...editedModel.metadata,
                      maxOutputTokens: parseNumberFromString(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={editedModel.metadata.description}
              onChange={(e) =>
                setEditedModel({
                  ...editedModel,
                  metadata: {
                    ...editedModel.metadata,
                    description: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <Label className="mb-2 block">Provider Costs</Label>
            <Tabs defaultValue={Object.keys(editedModel.providers)[0]}>
              <TabsList className="grid w-full grid-cols-5">
                {Object.keys(editedModel.providers).map((provider) => (
                  <TabsTrigger key={provider} value={provider}>
                    {provider}
                  </TabsTrigger>
                ))}
              </TabsList>
              {Object.entries(editedModel.providers).map(([provider, data]) => (
                <TabsContent key={provider} value={provider}>
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Available</Label>
                        <Switch
                          checked={data.available}
                          onCheckedChange={(checked) =>
                            handleProviderToggle(provider, checked)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Prompt Token Cost ($/1M tokens)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={data.cost.prompt_token.toFixed(2)}
                            onChange={(e) =>
                              handleProviderCostChange(
                                provider,
                                "prompt_token",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Completion Token Cost ($/1M tokens)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={data.cost.completion_token.toFixed(2)}
                            onChange={(e) =>
                              handleProviderCostChange(
                                provider,
                                "completion_token",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Cache Write Token Cost ($/1M tokens)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={
                              data.cost.prompt_cache_write_token
                                ? data.cost.prompt_cache_write_token.toFixed(2)
                                : ""
                            }
                            placeholder="Optional"
                            onChange={(e) =>
                              handleProviderCostChange(
                                provider,
                                "prompt_cache_write_token",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Cache Read Token Cost ($/1M tokens)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={
                              data.cost.prompt_cache_read_token
                                ? data.cost.prompt_cache_read_token.toFixed(2)
                                : ""
                            }
                            placeholder="Optional"
                            onChange={(e) =>
                              handleProviderCostChange(
                                provider,
                                "prompt_cache_read_token",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>

                      {data.modelString && (
                        <div>
                          <Label>Model String</Label>
                          <Input value={data.modelString} disabled />
                        </div>
                      )}

                      <div className="space-y-2 border-t pt-4">
                        <Label className="text-sm font-semibold">
                          Rate Limits
                        </Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Tokens Per Minute (TPM)</Label>
                            <Input
                              type="text"
                              value={formatNumberWithCommas(
                                data.rateLimit?.tpm,
                              )}
                              placeholder="e.g., 30,000,000"
                              onChange={(e) =>
                                handleRateLimitChange(
                                  provider,
                                  "tpm",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Requests Per Minute (RPM)</Label>
                            <Input
                              type="text"
                              value={formatNumberWithCommas(
                                data.rateLimit?.rpm,
                              )}
                              placeholder="e.g., 10,000"
                              onChange={(e) =>
                                handleRateLimitChange(
                                  provider,
                                  "rpm",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Tokens Per Day (TPD)</Label>
                            <Input
                              type="text"
                              value={formatNumberWithCommas(
                                data.rateLimit?.tpd,
                              )}
                              placeholder="e.g., 15,000,000,000"
                              onChange={(e) =>
                                handleRateLimitChange(
                                  provider,
                                  "tpd",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Requests Per Day (RPD)</Label>
                            <Input
                              type="text"
                              value={formatNumberWithCommas(
                                data.rateLimit?.rpd,
                              )}
                              placeholder="Optional"
                              onChange={(e) =>
                                handleRateLimitChange(
                                  provider,
                                  "rpd",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
