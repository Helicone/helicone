"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getJawnClient } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/public";
import { capitalizeModality } from "@/lib/constants/modalities";
import { getProviderLogo } from "@/lib/models/registry";

type ModelRegistryItem = components["schemas"]["ModelRegistryItem"];

const formatContext = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

const formatCost = (value: number) => {
  if (value === 0) return "Free";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(2)}`;
};

export default function ComparisonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [allModels, setAllModels] = useState<ModelRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstModel, setFirstModel] = useState<string>("");
  const [secondModel, setSecondModel] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Query params
  const model1Param = searchParams.get("model1");
  const model2Param = searchParams.get("model2");

  // Fetch all models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const jawnClient = getJawnClient();
        const response = await jawnClient.GET("/v1/public/model-registry/models");

        if (response.data?.data?.models) {
          setAllModels(response.data.data.models);
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Set initial model selections from query params once models are loaded
  useEffect(() => {
    if (allModels.length === 0) return;

    if (model1Param && !firstModel) {
      const found = allModels.find(
        (m) =>
          m.id === model1Param ||
          m.id.toLowerCase() === model1Param.toLowerCase() ||
          m.name.toLowerCase().includes(model1Param.toLowerCase())
      );
      if (found) setFirstModel(found.id);
    }

    if (model2Param && !secondModel) {
      const found = allModels.find(
        (m) =>
          m.id === model2Param ||
          m.id.toLowerCase() === model2Param.toLowerCase() ||
          m.name.toLowerCase().includes(model2Param.toLowerCase())
      );
      if (found) setSecondModel(found.id);
    }
  }, [allModels, model1Param, model2Param, firstModel, secondModel]);

  // Update URL when models change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams();
    if (firstModel) params.set("model1", firstModel);
    if (secondModel) params.set("model2", secondModel);

    const newUrl = params.toString() ? `/comparison?${params.toString()}` : "/comparison";
    router.replace(newUrl, { scroll: false });
  }, [firstModel, secondModel, router]);

  // Get model objects for comparison
  const model1Data = useMemo(
    () => allModels.find((m) => m.id === firstModel) || null,
    [allModels, firstModel]
  );
  const model2Data = useMemo(
    () => allModels.find((m) => m.id === secondModel) || null,
    [allModels, secondModel]
  );

  // Filter models for search
  const filteredModels = useMemo(() => {
    if (!searchTerm.trim()) return allModels;
    const query = searchTerm.toLowerCase();
    return allModels.filter(
      (model) =>
        model.name.toLowerCase().includes(query) ||
        model.id.toLowerCase().includes(query) ||
        model.author.toLowerCase().includes(query)
    );
  }, [allModels, searchTerm]);

  // Handle model card clicks - toggle selection
  const handleModelCardClick = (modelId: string) => {
    if (firstModel === modelId) {
      // Deselect first model
      setFirstModel("");
    } else if (secondModel === modelId) {
      // Deselect second model
      setSecondModel("");
    } else if (!firstModel) {
      // Set as first model
      setFirstModel(modelId);
    } else if (!secondModel && modelId !== firstModel) {
      // Set as second model
      setSecondModel(modelId);
    } else if (firstModel && secondModel) {
      // Both selected, replace second model
      setSecondModel(modelId);
    }
  };

  // Check if comparison is ready
  const showComparison = model1Data && model2Data;

  // Get pricing info for a model
  const getModelPricing = (model: ModelRegistryItem) => {
    const endpoint = model.endpoints && model.endpoints.length > 0 ? model.endpoints[0] : undefined;
    if (!endpoint) return { input: 0, output: 0 };
    const pricing =
      endpoint.pricingTiers && endpoint.pricingTiers.length > 0
        ? endpoint.pricingTiers[0]
        : endpoint.pricing;
    return { input: pricing.prompt, output: pricing.completion };
  };

  // Compare values helper
  const CompareValue = ({
    label,
    value1,
    value2,
    format = (v: string | number) => String(v),
    higherIsBetter = true,
  }: {
    label: string;
    value1: string | number;
    value2: string | number;
    format?: (v: string | number) => string;
    higherIsBetter?: boolean;
  }) => {
    const num1 = typeof value1 === "number" ? value1 : parseFloat(value1) || 0;
    const num2 = typeof value2 === "number" ? value2 : parseFloat(value2) || 0;
    const isBetter1 = higherIsBetter ? num1 > num2 : num1 < num2;
    const isBetter2 = higherIsBetter ? num2 > num1 : num2 < num1;

    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div
          className={`text-sm ${isBetter1 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-600 dark:text-gray-400"}`}
        >
          {format(value1)}
        </div>
        <div className="text-sm text-center text-gray-500 dark:text-gray-400 font-medium">
          {label}
        </div>
        <div
          className={`text-sm text-right ${isBetter2 ? "text-green-600 dark:text-green-400 font-medium" : "text-gray-600 dark:text-gray-400"}`}
        >
          {format(value2)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 px-4 py-8 flex flex-col items-center">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl font-semibold mb-4">
          Model <span className="text-brand">Comparison</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 font-light px-4">
          Compare costs, context lengths, and capabilities across AI models.
        </p>
      </div>

      {/* Model Selectors */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="w-full sm:w-[42%]">
            <Select value={firstModel} onValueChange={setFirstModel}>
              <SelectTrigger className="w-full h-12 text-sm">
                <SelectValue placeholder="Select first model" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {allModels.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    disabled={model.id === secondModel}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <img
                          src={getProviderLogo(model.author)}
                          alt={`${model.author} logo`}
                          className="w-4 h-4 object-contain"
                        />
                      </div>
                      <span className="truncate">{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-shrink-0 text-lg px-3 font-bold text-gray-400">VS</div>

          <div className="w-full sm:w-[42%]">
            <Select value={secondModel} onValueChange={setSecondModel}>
              <SelectTrigger className="w-full h-12 text-sm">
                <SelectValue placeholder="Select second model" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {allModels.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    disabled={model.id === firstModel}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                        <img
                          src={getProviderLogo(model.author)}
                          alt={`${model.author} logo`}
                          className="w-4 h-4 object-contain"
                        />
                      </div>
                      <span className="truncate">{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Comparison Panel - slides down when both models selected */}
      <div
        className={`w-full max-w-4xl mx-auto overflow-hidden transition-all duration-300 ease-in-out ${
          showComparison ? "max-h-[800px] opacity-100 mb-8" : "max-h-0 opacity-0"
        }`}
      >
        {showComparison && (
          <Card className="p-6 border border-gray-200 dark:border-gray-800">
            {/* Model Headers */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <img
                    src={getProviderLogo(model1Data.author)}
                    alt={model1Data.author}
                    className="w-5 h-5 object-contain"
                  />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {model1Data.name}
                  </div>
                  <div className="text-xs text-gray-500">{model1Data.author}</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-sm font-medium text-gray-400">Comparison</span>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {model2Data.name}
                  </div>
                  <div className="text-xs text-gray-500">{model2Data.author}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <img
                    src={getProviderLogo(model2Data.author)}
                    alt={model2Data.author}
                    className="w-5 h-5 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="space-y-0">
              <CompareValue
                label="Context Length"
                value1={model1Data.contextLength}
                value2={model2Data.contextLength}
                format={(v) => formatContext(Number(v))}
                higherIsBetter={true}
              />
              <CompareValue
                label="Max Output"
                value1={model1Data.maxOutput || 0}
                value2={model2Data.maxOutput || 0}
                format={(v) => (Number(v) > 0 ? formatContext(Number(v)) : "—")}
                higherIsBetter={true}
              />
              <CompareValue
                label="Input Cost"
                value1={getModelPricing(model1Data).input}
                value2={getModelPricing(model2Data).input}
                format={(v) => `${formatCost(Number(v))}/M`}
                higherIsBetter={false}
              />
              <CompareValue
                label="Output Cost"
                value1={getModelPricing(model1Data).output}
                value2={getModelPricing(model2Data).output}
                format={(v) => `${formatCost(Number(v))}/M`}
                higherIsBetter={false}
              />

              {/* Input Modalities */}
              <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {model1Data.inputModalities?.length > 0
                    ? model1Data.inputModalities.map(capitalizeModality).join(", ")
                    : "Text"}
                </div>
                <div className="text-sm text-center text-gray-500 dark:text-gray-400 font-medium">
                  Input Modalities
                </div>
                <div className="text-sm text-right text-gray-600 dark:text-gray-400">
                  {model2Data.inputModalities?.length > 0
                    ? model2Data.inputModalities.map(capitalizeModality).join(", ")
                    : "Text"}
                </div>
              </div>

              {/* Output Modalities */}
              <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {model1Data.outputModalities?.length > 0
                    ? model1Data.outputModalities.map(capitalizeModality).join(", ")
                    : "Text"}
                </div>
                <div className="text-sm text-center text-gray-500 dark:text-gray-400 font-medium">
                  Output Modalities
                </div>
                <div className="text-sm text-right text-gray-600 dark:text-gray-400">
                  {model2Data.outputModalities?.length > 0
                    ? model2Data.outputModalities.map(capitalizeModality).join(", ")
                    : "Text"}
                </div>
              </div>

              {/* Providers */}
              <div className="grid grid-cols-3 gap-4 py-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {model1Data.endpoints?.map((e) => e.provider).join(", ") || "N/A"}
                </div>
                <div className="text-sm text-center text-gray-500 dark:text-gray-400 font-medium">
                  Available Providers
                </div>
                <div className="text-sm text-right text-gray-600 dark:text-gray-400">
                  {model2Data.endpoints?.map((e) => e.provider).join(", ") || "N/A"}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Browse all models card */}
      <div className="w-full max-w-4xl mx-auto">
        <Card className="p-6 md:p-8 border border-gray-200 dark:border-gray-800 rounded-lg">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
            Browse all models
          </h2>

          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search models..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <span className="text-sm text-gray-500">
              {filteredModels.length} models
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border rounded-lg p-3 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
              {filteredModels.map((model) => {
                const isSelected = firstModel === model.id || secondModel === model.id;
                const isFirst = firstModel === model.id;
                const isSecond = secondModel === model.id;

                return (
                  <div
                    key={model.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-brand bg-brand/5"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    onClick={() => handleModelCardClick(model.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <img
                          src={getProviderLogo(model.author)}
                          alt={`${model.author} logo`}
                          className="w-4 h-4 object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-medium truncate ${
                            isSelected ? "text-brand" : "text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {model.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          {model.author}
                          {isFirst && (
                            <span className="text-[10px] bg-brand/20 text-brand px-1 rounded">1</span>
                          )}
                          {isSecond && (
                            <span className="text-[10px] bg-brand/20 text-brand px-1 rounded">2</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
