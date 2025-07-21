"use client";

import { ModelCostCardSkeleton } from "@/components/skeletons/ModelCostCardSkeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemedTextDropDown } from "@/components/ui/themedTextDropDown";
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  Search,
  Twitter,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { costOf, costOfPrompt } from "@helicone-package/cost"; // Ensure the path is correct
import { providers } from "@helicone-package/cost/providers/mappings"; // Ensure the path is correct
import CalculatorInfo, { formatProviderName } from "./CalculatorInfo";
import { ProviderWithModels } from "./utils";

// Define and export the CostData type
export type CostData = {
  provider: string;
  model: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
};

// Update props to accept initial data AND filter data from server
type ModelPriceCalculatorProps = {
  model?: string;
  provider?: string;
  initialCostData: CostData[];
  defaultInputTokens: number;
  defaultOutputTokens: number;
  providerWithModels: ProviderWithModels[]; // Add the new prop type
};

const FilterSection = ({
  providers,
  selectedProviders,
  selectedModels,
  searchQuery,
  onAddProvider,
  onRemoveProvider,
  onAddModel,
  onRemoveModel,
  onClearAll,
  onSearchChange,
}: {
  providers: ProviderWithModels[]; // Use the imported type
  selectedProviders: string[];
  selectedModels: string[];
  searchQuery: string;
  onAddProvider: (provider: string) => void;
  onRemoveProvider: (provider: string) => void;
  onAddModel: (model: string) => void;
  onRemoveModel: (model: string) => void;
  onClearAll: () => void;
  onSearchChange: (query: string) => void;
}) => {
  const availableProviders = providers
    .filter((p) => !selectedProviders.includes(p.provider))
    .map((p) => p.provider);

  const availableModels = providers
    .filter(
      (p) =>
        selectedProviders.length === 0 || selectedProviders.includes(p.provider)
    )
    .flatMap((p) => p.models)
    .filter((model) => !selectedModels.includes(model));

  const hasSelections =
    selectedProviders.length > 0 ||
    selectedModels.length > 0 ||
    searchQuery.length > 0;

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative w-full max-w-[20rem]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search models and providers..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-8 w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-3 text-xs font-normal leading-tight text-slate-700"
            />
          </div>
          <div className="w-full max-w-[10rem]">
            <ThemedTextDropDown
              options={availableProviders}
              onChange={(provider) => {
                if (provider) onAddProvider(provider);
              }}
              value="Filter by Provider"
              hideTabModes={true}
            />
          </div>
          <div className="w-full max-w-[10rem]">
            <ThemedTextDropDown
              options={availableModels}
              onChange={(model) => {
                if (model) onAddModel(model);
              }}
              value="Filter by Model"
              hideTabModes={true}
            />
          </div>
        </div>
        {hasSelections && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClearAll();
              onSearchChange("");
            }}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Clear All
          </Button>
        )}
      </div>
      {hasSelections && (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {selectedProviders.map((provider) => (
              <span
                key={provider}
                className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
              >
                {formatProviderName(provider)}
                <button
                  onClick={() => onRemoveProvider(provider)}
                  className="ml-2 text-slate-500 hover:text-slate-700 focus:outline-none"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {selectedModels.map((model) => (
              <span
                key={model}
                className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800"
              >
                {model}
                <button
                  onClick={() => onRemoveModel(model)}
                  className="ml-2 text-slate-500 hover:text-slate-700 focus:outline-none"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function ModelPriceCalculator({
  model,
  provider,
  initialCostData, // Receive initial data
  defaultInputTokens,
  defaultOutputTokens,
  providerWithModels, // Receive filter data
}: ModelPriceCalculatorProps) {
  // Initialize state with props from the server
  const [inputTokens, setInputTokens] = useState<string>(
    String(defaultInputTokens || "100")
  );
  const [outputTokens, setOutputTokens] = useState<string>(
    String(defaultOutputTokens || "100")
  );
  const [costData, setCostData] = useState<CostData[]>(initialCostData || []);
  const [selectedModelData, setSelectedModelData] = useState<CostData | null>(
    null
  );
  const pathname = usePathname();

  const [sortConfig, setSortConfig] = useState<{
    key: keyof CostData;
    direction: "asc" | "desc";
  } | null>(null);

  // Update these state declarations
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Start loading as false if initial data is provided
  const [isLoading, setIsLoading] = useState<boolean>(
    !initialCostData || initialCostData.length === 0
  );

  function formatCost(cost: number): string {
    if (cost === 0) return "0";
    if (cost < 0.000001) {
      return cost.toExponential(2);
    }
    return cost.toFixed(7).replace(/\.?0+$/, "");
  }

  // Effect to recalculate costs when USER changes token inputs
  useEffect(() => {
    const calculateCostsForUpdate = () => {
      setIsLoading(true);
      const updatedCostData: CostData[] = [];
      const inputTokensNum = parseInt(inputTokens) || 0;
      const outputTokensNum = parseInt(outputTokens) || 0;

      // Re-fetch providers data *within the effect* only when needed for calculation
      // This assumes `providers` mapping is relatively static and doesn't need constant updates
      // Alternatively, if costOf/costOfPrompt don't need the full providers map, adjust imports
      const currentProviders =
        require("@helicone-package/cost/providers/mappings").providers;

      currentProviders.forEach((prov: any) => {
        prov.costs?.forEach((modelCost: any) => {
          const costDetails = costOf({
            model: modelCost.model.value,
            provider: prov.provider,
          });
          const totalCost = costOfPrompt({
            model: modelCost.model.value,
            provider: prov.provider,
            promptTokens: inputTokensNum,
            promptCacheWriteTokens: 0,
            promptCacheReadTokens: 0,
            completionTokens: outputTokensNum,
            completionAudioTokens: 0,
            promptAudioTokens: 0,
          });

          if (costDetails) {
            const inputCostPer1k = costDetails.prompt_token * 1000;
            const outputCostPer1k = costDetails.completion_token * 1000;
            const inputCost = (inputTokensNum / 1000) * inputCostPer1k;
            const outputCost = (outputTokensNum / 1000) * outputCostPer1k;

            updatedCostData.push({
              provider: prov.provider,
              model: modelCost.model.value,
              inputCostPer1k,
              outputCostPer1k,
              inputCost,
              outputCost,
              totalCost: totalCost || 0,
            });
          } else {
            // Client-side warning
            console.warn(
              `[Client Cost Calc] Cost details not found for model: ${modelCost.model.value} by provider: ${prov.provider}`
            );
          }
        });
      });

      setCostData(updatedCostData);
      setIsLoading(false);
    };

    if (!isNaN(parseInt(inputTokens)) && !isNaN(parseInt(outputTokens))) {
      calculateCostsForUpdate();
    }
  }, [inputTokens, outputTokens]);

  // Effect to find selected model based on URL (remains the same)
  useEffect(() => {
    const urlParts = pathname.split("/");
    const urlProvider = urlParts[urlParts.indexOf("provider") + 1];
    const urlModel = urlParts[urlParts.indexOf("model") + 1];

    if (urlProvider && urlModel) {
      const decodedModel = decodeURIComponent(urlModel);
      const decodedProvider = decodeURIComponent(urlProvider);

      // Use the current costData state (which might be initial or updated)
      let selectedModel = costData.find(
        (data) =>
          data.model.toLowerCase() === decodedModel.toLowerCase() &&
          data.provider.toLowerCase() === decodedProvider.toLowerCase()
      );

      // Fallback logic remains the same...
      if (!selectedModel) {
        const providerData = providers.find(
          (p) => p.provider.toLowerCase() === decodedProvider.toLowerCase()
        );
        if (providerData?.modelDetails) {
          for (const [_, details] of Object.entries(
            providerData.modelDetails
          )) {
            if (
              details.searchTerms[0].toLowerCase() ===
              decodedModel.toLowerCase()
            ) {
              const firstMatchModel = details.matches[0];
              selectedModel = costData.find(
                (data) =>
                  data.model === firstMatchModel &&
                  data.provider.toLowerCase() === decodedProvider.toLowerCase()
              );
              break;
            }
          }
        }
      }

      if (selectedModel) {
        setSelectedModelData(selectedModel);
      }
    }
  }, [costData, pathname]);

  // Update the memoized filtered and sorted data
  const visibleCostData = useMemo(() => {
    let filteredData = costData.filter((data) => {
      // Provider and model filter logic
      const providerMatch =
        selectedProviders.length === 0 ||
        selectedProviders.includes(data.provider);
      const modelMatch =
        selectedModels.length === 0 || selectedModels.includes(data.model);

      // Fuzzy search logic
      let searchMatch = true;
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const providerName = data.provider.toLowerCase();
        const modelName = data.model.toLowerCase();

        // Check if search query matches provider or model (fuzzy matching)
        searchMatch = providerName.includes(query) || modelName.includes(query);
      }

      return providerMatch && modelMatch && searchMatch;
    });

    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [costData, selectedProviders, selectedModels, searchQuery, sortConfig]);

  const handleAddProvider = (provider: string) => {
    setSelectedProviders((prev) => [...prev, provider]);
  };

  const handleRemoveProvider = (provider: string) => {
    setSelectedProviders((prev) => prev.filter((p) => p !== provider));
  };

  const handleAddModel = (model: string) => {
    setSelectedModels((prev) => [...prev, model]);
  };

  const handleRemoveModel = (model: string) => {
    setSelectedModels((prev) => prev.filter((m) => m !== model));
  };

  // Add this function to handle Twitter sharing
  const handleTwitterShare = () => {
    if (!selectedModelData) return;

    const inputTokenCount = parseInt(inputTokens);
    const outputTokenCount = parseInt(outputTokens);
    const totalCost = formatCost(selectedModelData.totalCost);
    const inputCostPer1k = formatCost(selectedModelData.inputCostPer1k);
    const outputCostPer1k = formatCost(selectedModelData.outputCostPer1k);

    const tweetText = `I just used Helicone's API pricing calculator for ${formatProviderName(
      selectedModelData.provider
    )} ${selectedModelData.model}.

${inputTokenCount} input tokens + ${outputTokenCount} output tokens cost $${totalCost}

Input: $${inputCostPer1k}/1k tokens
Output: $${outputCostPer1k}/1k tokens

Optimize your AI API costs:`;

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(window.location.href)}`;
    window.open(tweetUrl, "_blank");
  };

  // Function to handle sorting
  const requestSort = (key: keyof CostData) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Function to get sort icon
  const getSortIcon = (key: keyof CostData) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <ChevronDown className="ml-1 inline-block h-4 w-4 text-slate-400" />
      );
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-1 inline-block h-4 w-4 text-slate-600" />
    ) : (
      <ChevronDown className="ml-1 inline-block h-4 w-4 text-slate-600" />
    );
  };

  const handleClearAll = () => {
    setSelectedProviders([]);
    setSelectedModels([]);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="mx-auto w-full p-4">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <Image
          src="/static/pricing-calc/coins.webp"
          alt="Pricing Calculator Icon"
          width={100}
          height={92}
          quality={100}
          className="mx-auto mb-4 h-auto w-auto max-w-[100px]"
        />
        <h1 className="mb-2 text-4xl font-semibold text-slate-700">
          {provider && model ? (
            <>
              {formatProviderName(provider)}{" "}
              <span style={{ color: "#0CA5EA" }}>{model}</span>
              <br />
            </>
          ) : (
            "LLM API "
          )}
          Pricing Calculator
        </h1>
        <p className="mb-4 text-slate-500">
          {provider && model
            ? `Calculate the cost of using ${model} with Helicone's free pricing tool.`
            : "Calculate the cost of using AI models with Helicone's free pricing tool."}
        </p>
      </div>

      <div className="mx-auto mb-6 flex h-9 max-w-xl items-start justify-start gap-4">
        <div className="flex h-9 shrink grow basis-0 items-center justify-start gap-4">
          <Label
            htmlFor="inputTokens"
            className="text-sm font-medium leading-tight text-black"
          >
            Input Tokens
          </Label>
          <div className="relative shrink grow basis-0 self-stretch">
            <Input
              id="inputTokens"
              type="number"
              value={inputTokens}
              onChange={(e) => setInputTokens(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-3 pr-3 text-sm font-normal leading-tight text-slate-700 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
        <div className="flex h-9 shrink grow basis-0 items-center justify-start gap-2">
          <Label
            htmlFor="outputTokens"
            className="text-sm font-medium leading-tight text-black"
          >
            Output Tokens
          </Label>
          <div className="inline-flex shrink grow basis-0 flex-col items-start justify-start gap-1.5">
            <div className="relative w-full self-stretch">
              <Input
                id="outputTokens"
                type="number"
                value={outputTokens}
                onChange={(e) => setOutputTokens(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-3 pr-3 text-sm font-normal leading-tight text-slate-700 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>
        <button
          className="inline-flex h-full items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700 transition-colors duration-100 hover:bg-slate-50"
          onClick={handleTwitterShare}
        >
          <Twitter className="h-4 w-4" />
          <span className="hidden text-sm font-medium md:block">Share</span>
        </button>
      </div>

      <div className="mx-auto mb-8 max-w-xl">
        {/* Only show the card when provider and model are in the URL/props */}
        {provider && model && selectedModelData ? (
          <Card className="p-4">
            <CardHeader className="mb-4 mt-1 p-0">
              <CardTitle className="flex items-center gap-2 text-base font-medium leading-none text-slate-900">
                <Calculator className="h-4 w-4 font-medium text-slate-500" />
                Model Cost Calculation
              </CardTitle>
              <div className="mt-2 flex items-center gap-2">
                <div className="relative h-4 w-4 opacity-10"></div>
                <div className="text-sm font-normal leading-tight text-slate-400">
                  {selectedModelData.provider} {selectedModelData.model}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-0">
              <div className="flex items-center justify-between pl-2">
                <span className="text-sm font-medium leading-tight text-slate-700">
                  Total Input Cost
                </span>
                <span className="text-sm font-semibold text-slate-500">
                  ${formatCost(selectedModelData.inputCost)}
                </span>
              </div>
              <div className="flex items-center justify-between pl-2">
                <span className="pb-2 text-sm font-normal leading-tight text-slate-400">
                  Input Cost/1k Tokens
                </span>
                <span className="text-sm font-normal text-slate-400">
                  ${formatCost(selectedModelData.inputCostPer1k)}/1k Tokens
                </span>
              </div>
              <div className="h-[0px] border-t border-slate-100 pt-2"></div>
              <div className="flex items-center justify-between pl-2">
                <span className="text-sm font-medium leading-tight text-slate-700">
                  Total Output Cost
                </span>
                <span className="text-sm font-semibold leading-4 text-slate-500">
                  ${formatCost(selectedModelData.outputCost)}
                </span>
              </div>
              <div className="flex items-center justify-between pl-2">
                <span className="pb-2 text-sm font-normal leading-tight text-slate-400">
                  Output Cost/1k Tokens
                </span>
                <span className="text-sm font-normal leading-4 text-slate-400">
                  ${formatCost(selectedModelData.outputCostPer1k)}/1k Tokens
                </span>
              </div>
              <div className="h-[0px] border-t border-slate-100 pt-2"></div>
              <div className="flex items-center justify-between pl-2">
                <span className="text-base font-semibold leading-tight text-slate-700">
                  Estimate Total Cost
                </span>
                <span className="text-base font-bold leading-tight text-sky-500">
                  ${formatCost(selectedModelData.totalCost)}
                </span>
              </div>

              <div className="pt-1"></div>

              <div className="justify-left items-left flex flex-col gap-1 rounded-lg border-2 border-sky-100 bg-sky-50 px-4 py-3 font-medium text-slate-500">
                <span>
                  Helicone users save{" "}
                  <span className="font-bold text-sky-500">up to 70%</span> on
                  their LLM costs...
                </span>
                <span className="mb-1 text-sm font-normal text-slate-400">
                  by caching, improving prompts, fine-tuning, etc.
                </span>
                <div className="mt-2">
                  <a
                    href="https://us.helicone.ai/signin"
                    className="inline-flex items-center rounded-md border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get started for free
                    <svg
                      className="rotate-270 ml-auto h-5 w-5 transform text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m9 18 6-6-6-6"
                      ></path>
                    </svg>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : /* Only show skeleton on model-specific pages */
        provider && model ? (
          <ModelCostCardSkeleton />
        ) : null}
      </div>

      <div className="mt-12 p-6">
        <FilterSection
          providers={providerWithModels}
          selectedProviders={selectedProviders}
          selectedModels={selectedModels}
          searchQuery={searchQuery}
          onAddProvider={handleAddProvider}
          onRemoveProvider={handleRemoveProvider}
          onAddModel={handleAddModel}
          onRemoveModel={handleRemoveModel}
          onClearAll={handleClearAll}
          onSearchChange={handleSearchChange}
        />

        {isLoading || visibleCostData.length === 0 ? (
          <TableSkeleton />
        ) : (
          <div className="w-full overflow-x-auto rounded-lg shadow-sm">
            <div className="min-w-[1000px]">
              <div className="max-h-[calc(200vh-600px)] min-h-[300px] overflow-y-auto">
                <table className="w-full border-separate border-spacing-0 divide-y divide-slate-200">
                  <thead className="sticky top-0 bg-slate-100">
                    <tr>
                      <th
                        scope="col"
                        className="w-1/6 cursor-pointer border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500 first:rounded-tl-lg"
                        onClick={() => requestSort("provider")}
                      >
                        Provider {getSortIcon("provider")}
                      </th>
                      <th
                        scope="col"
                        className="w-1/6 cursor-pointer border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                        onClick={() => requestSort("model")}
                      >
                        Model {getSortIcon("model")}
                      </th>
                      <th
                        scope="col"
                        className="cursor-pointer border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                        onClick={() => requestSort("inputCostPer1k")}
                      >
                        Input/1k <br />
                        Tokens {getSortIcon("inputCostPer1k")}
                      </th>
                      <th
                        scope="col"
                        className="cursor-pointer border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                        onClick={() => requestSort("outputCostPer1k")}
                      >
                        Output/1k <br />
                        Tokens {getSortIcon("outputCostPer1k")}
                      </th>
                      <th
                        scope="col"
                        className="cursor-pointer border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                        onClick={() => requestSort("inputCost")}
                      >
                        Input Cost {getSortIcon("inputCost")}
                      </th>
                      <th
                        scope="col"
                        className="cursor-pointer border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                        onClick={() => requestSort("outputCost")}
                      >
                        Output Cost {getSortIcon("outputCost")}
                      </th>
                      <th
                        scope="col"
                        className="cursor-pointer border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500 last:rounded-tr-lg"
                        onClick={() => requestSort("totalCost")}
                      >
                        Total Cost {getSortIcon("totalCost")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {visibleCostData.map((data, index) => (
                      <tr
                        key={index}
                        className={`transition-colors duration-150 hover:bg-sky-50 ${
                          data.provider === selectedModelData?.provider &&
                          data.model === selectedModelData?.model
                            ? "bg-sky-100"
                            : ""
                        }`}
                      >
                        <td className="whitespace-nowrap border border-slate-200 p-0 text-sm text-slate-500">
                          <Link
                            href={`/llm-cost/provider/${encodeURIComponent(
                              data.provider.toLowerCase()
                            )}/model/${encodeURIComponent(data.model)}`}
                            className="block h-full w-full px-6 py-2"
                          >
                            {formatProviderName(data.provider)}
                          </Link>
                        </td>
                        <td className="border border-slate-200 p-0 text-sm font-medium text-slate-900">
                          <Link
                            href={`/llm-cost/provider/${encodeURIComponent(
                              data.provider.toLowerCase()
                            )}/model/${encodeURIComponent(data.model)}`}
                            className="block h-full w-full px-6 py-2"
                          >
                            <div className="break-words">{data.model}</div>
                          </Link>
                        </td>
                        <td className="whitespace-nowrap border border-slate-200 p-0 text-sm text-slate-500">
                          <Link
                            href={`/llm-cost/provider/${encodeURIComponent(
                              data.provider.toLowerCase()
                            )}/model/${encodeURIComponent(data.model)}`}
                            className="block h-full w-full px-6 py-2"
                          >
                            ${formatCost(data.inputCostPer1k)}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap border border-slate-200 p-0 text-sm text-slate-500">
                          <Link
                            href={`/llm-cost/provider/${encodeURIComponent(
                              data.provider.toLowerCase()
                            )}/model/${encodeURIComponent(data.model)}`}
                            className="block h-full w-full px-6 py-2"
                          >
                            ${formatCost(data.outputCostPer1k)}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap border border-slate-200 p-0 text-sm text-slate-500">
                          <Link
                            href={`/llm-cost/provider/${encodeURIComponent(
                              data.provider.toLowerCase()
                            )}/model/${encodeURIComponent(data.model)}`}
                            className="block h-full w-full px-6 py-2"
                          >
                            ${formatCost(data.inputCost)}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap border border-slate-200 p-0 text-sm text-slate-500">
                          <Link
                            href={`/llm-cost/provider/${encodeURIComponent(
                              data.provider.toLowerCase()
                            )}/model/${encodeURIComponent(data.model)}`}
                            className="block h-full w-full px-6 py-2"
                          >
                            ${formatCost(data.outputCost)}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap border border-slate-200 p-0 text-sm font-medium text-sky-500">
                          <Link
                            href={`/llm-cost/provider/${encodeURIComponent(
                              data.provider.toLowerCase()
                            )}/model/${encodeURIComponent(data.model)}`}
                            className="block h-full w-full px-6 py-2"
                          >
                            ${formatCost(data.totalCost)}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <CalculatorInfo model={model} provider={provider} />
    </div>
  );
}
