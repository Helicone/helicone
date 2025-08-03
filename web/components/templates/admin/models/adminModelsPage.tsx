import { useState, useMemo } from "react";
import { EditModelDialog } from "./EditModelDialog";
import { ImportCSVDialog } from "./ImportCSVDialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, Plus, Download, Upload, GitBranch } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  models, 
  modelRegistry,
  MODEL_CREATORS, 
  PROVIDER_NAMES,
  type ResolvedModel 
} from "@helicone-package/cost/models";
import useNotification from "@/components/shared/notification/useNotification";

export default function AdminModelsPage() {
  const { setNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [editingModel, setEditingModel] = useState<ResolvedModel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [showDisabled, setShowDisabled] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState<boolean | null>(null);
  
  // Check if we're in development mode
  useMemo(() => {
    if (typeof window !== 'undefined') {
      setIsDevelopment(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    }
  }, []);

  // Get models from the registry, organized by hierarchy
  const { baseModels, variantsByBase } = useMemo(() => {
    const baseList: ResolvedModel[] = [];
    const variantsMap: Record<string, ResolvedModel[]> = {};
    
    // Get all base models
    for (const modelId in modelRegistry.models) {
      const model = models.get(modelId);
      if (model) {
        baseList.push(model);
        variantsMap[modelId] = [];
      }
    }
    
    // Get all variants and group by base model
    for (const variantId in modelRegistry.variants) {
      const variant = models.get(variantId);
      if (variant && variant.baseModelId) {
        if (!variantsMap[variant.baseModelId]) {
          variantsMap[variant.baseModelId] = [];
        }
        variantsMap[variant.baseModelId].push(variant);
      }
    }
    
    return { baseModels: baseList, variantsByBase: variantsMap };
  }, []);

  // Filter models based on search and filters
  const filteredModels = useMemo(() => {
    return baseModels.filter((model) => {
      const matchesSearch = searchQuery
        ? model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.metadata.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesProvider = selectedProvider === "all" 
        ? true 
        : Object.keys(model.providers).includes(selectedProvider);

      const matchesCreator = selectedCreator === "all"
        ? true
        : model.creator === selectedCreator;

      // Check if model is disabled (either model-level flag or all providers disabled)
      const isDisabled = model.disabled || Object.values(model.providers).every(p => !p.available);
      
      // If showDisabled is false, hide disabled models
      if (!showDisabled && isDisabled) {
        return false;
      }

      return matchesSearch && matchesProvider && matchesCreator;
    });
  }, [baseModels, searchQuery, selectedProvider, selectedCreator, showDisabled]);

  const handleEditModel = (model: ResolvedModel) => {
    setEditingModel(model);
    setIsEditDialogOpen(true);
  };

  const handleSaveModel = async (updatedModel: ResolvedModel) => {
    try {
      // Create a new models object with the update
      const updatedModels = { ...modelRegistry.models };
      
      // If it's a base model (not a variant), update it
      if (!updatedModel.baseModelId) {
        updatedModels[updatedModel.id] = {
          id: updatedModel.id,
          creator: updatedModel.creator,
          metadata: updatedModel.metadata,
          providers: updatedModel.providers,
          slug: updatedModel.slug,
          disabled: updatedModel.disabled,
        };
      }

      const response = await fetch("/api/admin/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: updatedModels }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && !data.isDevelopment) {
          setNotification("Model updates are only available in development mode. Please run locally to make changes.", "error");
          return;
        }
        throw new Error(data.error || "Failed to save model");
      }

      // Show success message
      setNotification("Model updated successfully! Changes saved to source files.", "success");
      
      // Reload the page to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error saving model:", error);
      setNotification("Failed to save model. Check console for details.", "error");
    }
  };

  const handleImportCSV = async (csvData: any[]) => {
    try {
      // Process CSV data and update models
      const updatedModels = { ...modelRegistry.models };
      
      csvData.forEach((row) => {
        const modelId = row.model_id;
        const provider = row.provider;
        
        // Check if model exists, if not create a basic structure
        if (!updatedModels[modelId]) {
          updatedModels[modelId] = {
            id: modelId,
            creator: row.creator || "Unknown",
            metadata: {
              displayName: modelId,
              description: "",
              contextWindow: parseInt(row.context_window) || 4096,
              releaseDate: new Date().toISOString().split("T")[0],
            },
            providers: {},
            slug: modelId,
          };
        }
        
        // Update provider costs
        updatedModels[modelId].providers[provider] = {
          provider: provider,
          available: true,
          cost: {
            prompt_token: parseFloat(row.prompt_cost) || 0,
            completion_token: parseFloat(row.completion_cost) || 0,
          },
        };
      });

      const response = await fetch("/api/admin/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: updatedModels }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && !data.isDevelopment) {
          setNotification("CSV imports are only available in development mode. Please run locally to make changes.", "error");
          return;
        }
        throw new Error(data.error || "Failed to import models");
      }

      setNotification("Models imported successfully! Changes saved to source files.", "success");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error importing CSV:", error);
      setNotification("Failed to import CSV. Check console for details.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {isDevelopment === false && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Read-only mode:</strong> Model updates are only available in development. Run locally to make changes.
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <H1>Model Registry</H1>
          <P className="text-muted-foreground">
            Manage AI model costs across {PROVIDER_NAMES.length} providers
          </P>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
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
                {Object.values(variantsByBase).reduce((sum, variants) => sum + variants.length, 0)} total variants
              </span>
              {(() => {
                const disabledCount = baseModels.filter(m => 
                  m.disabled || Object.values(m.providers).every(p => !p.available)
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
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModels.map((model) => {
                const isDisabled = model.disabled || Object.values(model.providers).every(p => !p.available);
                return (
                <>
                  <TableRow key={model.id} className={isDisabled ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{model.metadata.displayName}</div>
                          <div className="text-xs text-muted-foreground">{model.id}</div>
                        </div>
                        {isDisabled && (
                          <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                            Disabled
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{model.creator}</TableCell>
                    <TableCell>{model.metadata.contextWindow.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Object.entries(model.providers).slice(0, 3).map(([provider, data]) => (
                          <span
                            key={provider}
                            className={`inline-flex items-center px-2 py-1 text-xs rounded-md ${
                              data.available ? "bg-muted" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditModel(model)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  {showVariants && variantsByBase[model.id]?.map((variant) => {
                    const isVariantDisabled = variant.disabled || Object.values(variant.providers).every(p => !p.available);
                    return (
                      <TableRow key={variant.id} className={`bg-muted/30 ${isVariantDisabled ? "opacity-50" : ""}`}>
                        <TableCell>
                          <div className="flex items-start gap-2 pl-4">
                            <GitBranch className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium">{variant.metadata.displayName}</div>
                                <div className="text-xs text-muted-foreground">{variant.id}</div>
                              </div>
                              {isVariantDisabled && (
                                <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                                  Disabled
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{variant.creator}</TableCell>
                        <TableCell>{variant.metadata.contextWindow.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {Object.entries(variant.providers).slice(0, 3).map(([provider, data]) => (
                              <span
                                key={provider}
                                className={`inline-flex items-center px-2 py-1 text-xs rounded-md ${
                                  data.available ? "bg-muted" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                }`}
                              >
                                {provider}
                              </span>
                            ))}
                            {Object.keys(variant.providers).length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{Object.keys(variant.providers).length - 3} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditModel(variant)}
                          >
                            Edit
                          </Button>
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

      <EditModelDialog
        model={editingModel}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveModel}
      />

      <ImportCSVDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImportCSV}
      />
    </div>
  );
}