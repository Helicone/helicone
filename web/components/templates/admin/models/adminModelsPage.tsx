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
import { ModelDetailsDialog } from "./ModelDetailsDialog";
import { registry } from "@helicone-package/cost/models/registry";
import type {
  ModelConfig as Model,
  Endpoint as ModelEndpoint,
} from "@helicone-package/cost/models/types";

export default function AdminModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [showVariants, setShowVariants] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedModelKey, setSelectedModelKey] = useState<string>("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  // Get registry data directly from the package
  const registryData = useMemo(() => {
    const modelsResult = registry.getAllModelsWithIds();
    if (modelsResult.error || !modelsResult.data) {
      // Return empty data if error
      return {
        models: {} as Record<string, Model>,
        endpoints: {} as Record<string, ModelEndpoint[]>,
        authors: {} as Record<
          string,
          { modelCount: number; supported: boolean }
        >,
        modelVersions: {} as Record<string, string[]>,
      };
    }

    const models = modelsResult.data as Record<string, Model>;
    const endpoints: Record<string, ModelEndpoint[]> = {};
    const authors: Record<string, { modelCount: number; supported: boolean }> =
      {};

    Object.keys(models).forEach((modelId) => {
      // Get all PTB endpoints for this model
      const endpointsResult = registry.getPtbEndpoints(modelId);
      endpoints[modelId] = endpointsResult.data || [];
    });

    Object.values(models).forEach((model) => {
      if (!authors[model.author]) {
        authors[model.author] = { modelCount: 0, supported: true };
      }
      authors[model.author].modelCount++;
    });

    return {
      models,
      endpoints,
      authors,
      modelVersions: {} as Record<string, string[]>,
    };
  }, []);

  const handleModelClick = (modelKey: string) => {
    const model = registryData.models[modelKey];
    if (model) {
      setSelectedModel(model);
      setSelectedModelKey(modelKey);
      setIsDetailsOpen(true);
    }
  };

  // Get unique providers from endpoints
  const allProviders = useMemo(() => {
    const providers = new Set<string>();
    Object.values(registryData.endpoints).forEach((endpointList) => {
      endpointList.forEach((endpoint) => {
        providers.add(endpoint.provider);
      });
    });
    return Array.from(providers).sort();
  }, [registryData]);

  // Get all authors
  const allAuthors = useMemo(() => {
    return Object.keys(registryData.authors).sort();
  }, [registryData]);

  // Filter models based on search and filters
  const filteredModels = useMemo(() => {
    return Object.entries(registryData.models).filter(([modelKey, model]) => {
      const matchesSearch = searchQuery
        ? modelKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const endpoints = registryData.endpoints[modelKey] || [];
      const matchesProvider =
        selectedProvider === "all"
          ? true
          : endpoints.some(
              (ep: ModelEndpoint) => ep.provider === selectedProvider,
            );

      const matchesAuthor =
        selectedAuthor === "all" ? true : model.author === selectedAuthor;

      // Check if model is disabled (no endpoints)
      const isDisabled = endpoints.length === 0;

      // If showDisabled is false, hide disabled models
      if (!showDisabled && isDisabled) {
        return false;
      }

      return matchesSearch && matchesProvider && matchesAuthor;
    });
  }, [
    registryData,
    searchQuery,
    selectedProvider,
    selectedAuthor,
    showDisabled,
  ]);

  // Group models by base model
  const { baseModels, variantsByBase } = useMemo(() => {
    const bases: Array<[string, Model]> = [];
    const variants: Record<string, Array<[string, Model]>> = {};

    filteredModels.forEach(([modelKey, model]) => {
      // Check if this is a variant
      let isVariant = false;
      for (const [baseKey, versionList] of Object.entries(
        registryData.modelVersions || {},
      )) {
        if (versionList.includes(modelKey)) {
          isVariant = true;
          if (!variants[baseKey]) {
            variants[baseKey] = [];
          }
          variants[baseKey].push([modelKey, model]);
          break;
        }
      }

      if (!isVariant) {
        bases.push([modelKey, model]);
      }
    });

    return { baseModels: bases, variantsByBase: variants };
  }, [filteredModels, registryData]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <H1>Model Registry</H1>
          <P className="text-muted-foreground">
            View AI model costs across {allProviders.length} providers
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
                {allProviders.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Authors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {allAuthors.map((author) => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{baseModels.length} base models</span>
              <span>•</span>
              <span>
                {Object.values(variantsByBase).reduce(
                  (sum, variants) => sum + variants.length,
                  0,
                )}{" "}
                variants
              </span>
              {(() => {
                const disabledCount = Object.entries(
                  registryData.models,
                ).filter(([modelKey]) => {
                  const endpoints = registryData.endpoints[modelKey] || [];
                  return endpoints.length === 0;
                }).length;
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
                <TableHead>Author</TableHead>
                <TableHead>Context Window</TableHead>
                <TableHead>Endpoints</TableHead>
                <TableHead className="text-right">Cost Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baseModels.map(([modelKey, model]) => {
                const endpoints = registryData.endpoints[modelKey] || [];
                const isDisabled = endpoints.length === 0;
                const costs = endpoints.map(
                  (ep: ModelEndpoint) => ep.pricing[0]?.input,
                );
                const minCost = costs.length > 0 ? Math.min(...costs) : 0;
                const maxCost = costs.length > 0 ? Math.max(...costs) : 0;

                return (
                  <>
                    <TableRow
                      key={modelKey}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${isDisabled ? "opacity-50" : ""}`}
                      onClick={() => handleModelClick(modelKey)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {model.name.replace(/^[^:]+:\s*/, "")}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {modelKey}
                            </div>
                          </div>
                          {isDisabled && (
                            <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                              Disabled
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{model.author}</TableCell>
                      <TableCell>
                        {model.contextLength.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {endpoints
                            .slice(0, 3)
                            .map((endpoint: ModelEndpoint, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                              >
                                {endpoint.provider}
                              </span>
                            ))}
                          {endpoints.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{endpoints.length - 3} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-xs">
                          ${(minCost / 1000000).toFixed(2)} - $
                          {(maxCost / 1000000).toFixed(2)}/1K
                        </div>
                      </TableCell>
                    </TableRow>
                    {showVariants &&
                      variantsByBase[modelKey]?.map(([variantKey, variant]) => {
                        const variantEndpoints =
                          registryData.endpoints[variantKey] || [];
                        const isVariantDisabled = variantEndpoints.length === 0;
                        const variantCosts = variantEndpoints.map(
                          (ep: ModelEndpoint) => ep.pricing[0]?.input,
                        );
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
                            key={variantKey}
                            className={`cursor-pointer bg-muted/30 transition-colors hover:bg-muted/50 ${isVariantDisabled ? "opacity-50" : ""}`}
                            onClick={() => handleModelClick(variantKey)}
                          >
                            <TableCell>
                              <div className="flex items-start gap-2 pl-4">
                                <GitBranch className="mt-0.5 h-4 w-4 text-muted-foreground" />
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">
                                      {variant.name.replace(/^[^:]+:\s*/, "")}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {variantKey}
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
                            <TableCell>{variant.author}</TableCell>
                            <TableCell>
                              {variant.contextLength.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {variantEndpoints
                                  .slice(0, 3)
                                  .map(
                                    (endpoint: ModelEndpoint, idx: number) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs"
                                      >
                                        {endpoint.provider}
                                      </span>
                                    ),
                                  )}
                                {variantEndpoints.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{variantEndpoints.length - 3} more
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="text-xs">
                                ${(variantMinCost / 1000000).toFixed(2)} - $
                                {(variantMaxCost / 1000000).toFixed(2)}/1K
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
        modelKey={selectedModelKey}
        endpoints={
          selectedModelKey ? registryData.endpoints[selectedModelKey] || [] : []
        }
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  );
}
