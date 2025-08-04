import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { H1, P } from "@/components/ui/typography";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, GitBranch } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  models,
  modelRegistry,
  MODEL_CREATORS,
  PROVIDER_NAMES,
  type Model,
} from "@helicone-package/cost/models";
import { ModelDetailsDialog } from "./ModelDetailsDialog";

export default function AdminModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [showVariants, setShowVariants] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleModelClick = (model: Model) => {
    setSelectedModel(model);
    setIsDetailsOpen(true);
  };

  // Get models from the registry, organized by hierarchy
  const { baseModels, variantsByBase } = useMemo(() => {
    const baseList: Model[] = [];
    const variantsMap: Record<string, Model[]> = {};

    // Get all base models and their variants
    for (const [modelId, baseModel] of Object.entries(modelRegistry.models)) {
      baseList.push(baseModel);
      variantsMap[modelId] = [];
      
      // Get nested variants for this base model
      if (baseModel.variants) {
        for (const variantId of Object.keys(baseModel.variants)) {
          const variant = models.get(variantId);
          if (variant) {
            variantsMap[modelId].push(variant);
          }
        }
      }
    }

    return { baseModels: baseList, variantsByBase: variantsMap };
  }, []);

  // Filter models based on search and filters
  const filteredModels = useMemo(() => {
    return baseModels.filter((model) => {
      const matchesSearch = searchQuery
        ? model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.metadata.displayName
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : true;

      const matchesProvider =
        selectedProvider === "all"
          ? true
          : Object.keys(model.providers).includes(selectedProvider);

      const matchesCreator =
        selectedCreator === "all" ? true : model.creator === selectedCreator;

      // Check if model is disabled (either model-level flag or all providers disabled)
      const isDisabled =
        model.disabled ||
        Object.values(model.providers).every((p) => !p.available);

      // If showDisabled is false, hide disabled models
      if (!showDisabled && isDisabled) {
        return false;
      }

      return matchesSearch && matchesProvider && matchesCreator;
    });
  }, [
    baseModels,
    searchQuery,
    selectedProvider,
    selectedCreator,
    showDisabled,
  ]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <H1>Model Registry</H1>
          <P className="text-muted-foreground">
            View AI model costs across {PROVIDER_NAMES.length} providers
          </P>
        </div>
      </div>

      <Card className="p-4">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {PROVIDER_NAMES.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCreator} onValueChange={setSelectedCreator}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Creators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                {MODEL_CREATORS.map((creator) => (
                  <SelectItem key={creator} value={creator}>
                    {creator}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{filteredModels.length} base models</span>
              <span>•</span>
              <span>
                {Object.values(variantsByBase).reduce(
                  (sum, variants) => sum + variants.length,
                  0,
                )}{" "}
                total variants
              </span>
              {(() => {
                const disabledCount = baseModels.filter(
                  (m) =>
                    m.disabled ||
                    Object.values(m.providers).every((p) => !p.available),
                ).length;
                return disabledCount > 0 && !showDisabled ? (
                  <>
                    <span>•</span>
                    <span className="text-yellow-600 dark:text-yellow-400">
                      {disabledCount} hidden
                    </span>
                  </>
                ) : null;
              })()}
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <Label htmlFor="show-disabled" className="text-sm">
                  Show disabled
                </Label>
                <Switch
                  id="show-disabled"
                  checked={showDisabled}
                  onCheckedChange={setShowDisabled}
                />
              </div>

              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="show-variants" className="text-sm">
                  Show variants
                </Label>
                <Switch
                  id="show-variants"
                  checked={showVariants}
                  onCheckedChange={setShowVariants}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Model</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Context Window</TableHead>
                <TableHead>Providers</TableHead>
                <TableHead className="text-right">Cost Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => {
                const isDisabled =
                  model.disabled ||
                  Object.values(model.providers).every((p) => !p.available);
                const costs = Object.values(model.providers)
                  .filter((p) => p.available && p.cost)
                  .map((p) => p.cost.prompt_token);
                const minCost = costs.length > 0 ? Math.min(...costs) : 0;
                const maxCost = costs.length > 0 ? Math.max(...costs) : 0;

                return (
                  <>
                    <TableRow
                      key={model.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${isDisabled ? "opacity-50" : ""}`}
                      onClick={() => handleModelClick(model)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {model.metadata.displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {model.id}
                            </div>
                          </div>
                          {isDisabled && (
                            <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                              Disabled
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{model.creator}</TableCell>
                      <TableCell>
                        {model.metadata.contextWindow.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Object.entries(model.providers)
                            .slice(0, 3)
                            .map(([provider, data]) => (
                              <span
                                key={provider}
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${
                                  data.available
                                    ? "bg-muted"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                }`}
                              >
                                {provider}
                              </span>
                            ))}
                          {Object.keys(model.providers).length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{Object.keys(model.providers).length - 3} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-xs">
                          ${minCost.toFixed(2)} - ${maxCost.toFixed(2)}/1M
                        </div>
                      </TableCell>
                    </TableRow>
                    {showVariants &&
                      variantsByBase[model.id]?.map((variant) => {
                        const isVariantDisabled =
                          variant.disabled ||
                          Object.values(variant.providers).every(
                            (p) => !p.available,
                          );
                        const variantCosts = Object.values(variant.providers)
                          .filter((p) => p.available && p.cost)
                          .map((p) => p.cost.prompt_token);
                        const variantMinCost =
                          variantCosts.length > 0
                            ? Math.min(...variantCosts)
                            : 0;
                        const variantMaxCost =
                          variantCosts.length > 0
                            ? Math.max(...variantCosts)
                            : 0;

                        return (
                          <TableRow
                            key={variant.id}
                            className={`bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors ${isVariantDisabled ? "opacity-50" : ""}`}
                            onClick={() => handleModelClick(variant)}
                          >
                            <TableCell>
                              <div className="flex items-start gap-2 pl-4">
                                <GitBranch className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">
                                      {variant.metadata.displayName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {variant.id}
                                    </div>
                                  </div>
                                  {isVariantDisabled && (
                                    <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                                      Disabled
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{variant.creator}</TableCell>
                            <TableCell>
                              {variant.metadata.contextWindow.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {Object.entries(variant.providers)
                                  .slice(0, 3)
                                  .map(([provider, data]) => (
                                    <span
                                      key={provider}
                                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${
                                        data.available
                                          ? "bg-muted"
                                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                      }`}
                                    >
                                      {provider}
                                    </span>
                                  ))}
                                {Object.keys(variant.providers).length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{Object.keys(variant.providers).length - 3}{" "}
                                    more
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-xs">
                                ${variantMinCost.toFixed(2)} - $
                                {variantMaxCost.toFixed(2)}/1M
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <ModelDetailsDialog
        model={selectedModel}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
