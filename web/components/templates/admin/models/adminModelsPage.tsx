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

export default function AdminModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedCreator, setSelectedCreator] = useState<string>("all");
  const [editingModel, setEditingModel] = useState<ResolvedModel | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showVariants, setShowVariants] = useState(false);

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

      return matchesSearch && matchesProvider && matchesCreator;
    });
  }, [baseModels, searchQuery, selectedProvider, selectedCreator]);

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
        };
      }

      const response = await fetch("/api/admin/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ models: updatedModels }),
      });

      if (!response.ok) {
        throw new Error("Failed to save model");
      }

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error("Error saving model:", error);
      alert("Failed to save model. Check console for details.");
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

      if (!response.ok) {
        throw new Error("Failed to import models");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error importing CSV:", error);
      alert("Failed to import CSV. Check console for details.");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
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
              {filteredModels.map((model) => (
                <>
                  <TableRow key={model.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{model.metadata.displayName}</div>
                        <div className="text-xs text-muted-foreground">{model.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{model.creator}</TableCell>
                    <TableCell>{model.metadata.contextWindow.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Object.keys(model.providers).slice(0, 3).map((provider) => (
                          <span
                            key={provider}
                            className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-muted"
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
                  {showVariants && variantsByBase[model.id]?.map((variant) => (
                    <TableRow key={variant.id} className="bg-muted/30">
                      <TableCell>
                        <div className="flex items-start gap-2 pl-4">
                          <GitBranch className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <div className="font-medium">{variant.metadata.displayName}</div>
                            <div className="text-xs text-muted-foreground">{variant.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{variant.creator}</TableCell>
                      <TableCell>{variant.metadata.contextWindow.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Object.keys(variant.providers).slice(0, 3).map((provider) => (
                            <span
                              key={provider}
                              className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-muted"
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
                  ))}
                </>
              ))}
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