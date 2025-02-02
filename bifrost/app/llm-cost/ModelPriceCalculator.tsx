"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Calculator,
  Twitter,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  XCircle,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { costOf, costOfPrompt } from "../../packages/cost"; // Ensure the path is correct
import { providers } from "../../packages/cost/providers/mappings"; // Ensure the path is correct
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePathname } from "next/navigation";
import Link from "next/link";
import CalculatorInfo, { formatProviderName } from "./CalculatorInfo";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemedTextDropDown } from "@/components/ui/themedTextDropDown";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ModelPriceCalculatorProps = {
  model?: string;
  provider?: string;
};

type CostData = {
  provider: string;
  model: string;
  inputCostPer1k: number;
  outputCostPer1k: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
};

const FilterSection = ({
  providers,
  selectedProviders,
  selectedModels,
  onAddProvider,
  onRemoveProvider,
  onAddModel,
  onRemoveModel,
  onClearAll,
}: {
  providers: { provider: string; models: string[] }[];
  selectedProviders: string[];
  selectedModels: string[];
  onAddProvider: (provider: string) => void;
  onRemoveProvider: (provider: string) => void;
  onAddModel: (model: string) => void;
  onRemoveModel: (model: string) => void;
  onClearAll: () => void;
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
    selectedProviders.length > 0 || selectedModels.length > 0;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2">
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
            onClick={onClearAll}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Clear All
          </Button>
        )}
      </div>
      {hasSelections && (
        <>
          <div className="flex flex-wrap gap-2 items-center mb-2">
            {selectedProviders.map((provider) => (
              <span
                key={provider}
                className="inline-flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {formatProviderName(provider)}
                <button
                  onClick={() => onRemoveProvider(provider)}
                  className="ml-2 text-slate-500 hover:text-slate-700 focus:outline-none"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center mb-2">
            {selectedModels.map((model) => (
              <span
                key={model}
                className="inline-flex items-center bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full"
              >
                {model}
                <button
                  onClick={() => onRemoveModel(model)}
                  className="ml-2 text-slate-500 hover:text-slate-700 focus:outline-none"
                >
                  <XCircle className="w-4 h-4" />
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
}: ModelPriceCalculatorProps) {
  const [inputTokens, setInputTokens] = useState<string>("100");
  const [outputTokens, setOutputTokens] = useState<string>("100");
  const [costData, setCostData] = useState<CostData[]>([]);
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

  function formatCost(cost: number): string {
    if (cost === 0) return "0";
    if (cost < 0.000001) {
      return cost.toExponential(2);
    }
    return cost.toFixed(7).replace(/\.?0+$/, "");
  }

  useEffect(() => {
    const calculateCosts = () => {
      const updatedCostData: CostData[] = [];
      const inputTokensNum = parseInt(inputTokens) || 0;
      const outputTokensNum = parseInt(outputTokens) || 0;

      providers.forEach((prov) => {
        prov.costs?.forEach((modelCost) => {
          const costDetails = costOf({
            model: modelCost.model.value,
            provider: prov.provider,
          });

          const totalCost = costOfPrompt({
            model: modelCost.model.value,
            provider: prov.provider,
            promptTokens: inputTokensNum,
            completionTokens: outputTokensNum,
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
            console.warn(
              `Cost details not found for model: ${modelCost.model.value} by provider: ${prov.provider}`
            );
          }
        });
      });

      setCostData(updatedCostData);
    };

    calculateCosts();
  }, [inputTokens, outputTokens]);

  useEffect(() => {
    const urlParts = pathname.split("/");
    const urlProvider = urlParts[urlParts.indexOf("provider") + 1];
    const urlModel = urlParts[urlParts.indexOf("model") + 1];

    if (urlProvider && urlModel) {
      const decodedModel = decodeURIComponent(urlModel);
      const decodedProvider = decodeURIComponent(urlProvider);

      // First try to find exact match
      let selectedModel = costData.find(
        (data) =>
          data.model.toLowerCase() === decodedModel.toLowerCase() &&
          data.provider.toLowerCase() === decodedProvider.toLowerCase()
      );

      // If not found, check if it's a parent model
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
              // Use the first matching model's costs
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
    let filteredData = costData.filter(
      (data) =>
        (selectedProviders.length === 0 ||
          selectedProviders.includes(data.provider)) &&
        (selectedModels.length === 0 || selectedModels.includes(data.model))
    );

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
  }, [costData, selectedProviders, selectedModels, sortConfig]);

  // Update these memoized values
  const uniqueProviders = useMemo(() => {
    return Array.from(new Set(costData.map((data) => data.provider))).sort();
  }, [costData]);

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
        <ChevronDown className="inline-block ml-1 w-4 h-4 text-slate-400" />
      );
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="inline-block ml-1 w-4 h-4 text-slate-600" />
    ) : (
      <ChevronDown className="inline-block ml-1 w-4 h-4 text-slate-600" />
    );
  };

  const providerWithModels = useMemo(() => {
    return uniqueProviders.map((provider) => ({
      provider,
      models: costData
        .filter((data) => data.provider === provider)
        .map((data) => data.model),
    }));
  }, [uniqueProviders, costData]);

  const handleClearAll = () => {
    setSelectedProviders([]);
    setSelectedModels([]);
  };

  return (
    <div className="w-full mx-auto p-4">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <Image
          src="/static/pricing-calc/coins.webp"
          alt="Pricing Calculator Icon"
          width={99.16}
          height={92}
          quality={100}
          className="mx-auto mb-4"
          style={{
            width: "auto",
            height: "auto",
            maxWidth: "100px",
          }}
        />
        <h1 className="text-4xl font-semibold text-slate-700 mb-2">
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
        <p className="text-slate-500 mb-4">
          {provider && model
            ? `Calculate the cost of using ${model} with Helicone's free pricing tool.`
            : "Calculate the cost of using AI models with Helicone's free pricing tool."}
        </p>
      </div>

      <div className="max-w-xl mx-auto h-9 flex justify-start items-start gap-4 mb-6">
        <div className="grow shrink basis-0 h-9 flex justify-start items-center gap-4">
          <Label
            htmlFor="inputTokens"
            className="text-black text-sm font-medium leading-tight"
          >
            Input Tokens
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-slate-500 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Number of tokens in the input prompt.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="grow shrink basis-0 self-stretch relative">
            <Input
              id="inputTokens"
              type="number"
              value={inputTokens}
              onChange={(e) => setInputTokens(e.target.value)}
              className="pl-3 pr-3 py-2 bg-white rounded-md border border-slate-300 text-slate-700 text-sm font-normal leading-tight w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
        <div className="grow shrink basis-0 h-9 flex justify-start items-center gap-2">
          <Label
            htmlFor="outputTokens"
            className="text-black text-sm font-medium leading-tight"
          >
            Output Tokens
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-slate-500 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Number of tokens in the output response.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="grow shrink basis-0 flex-col justify-start items-start gap-1.5 inline-flex">
            <div className="self-stretch relative w-full">
              <Input
                id="outputTokens"
                type="number"
                value={outputTokens}
                onChange={(e) => setOutputTokens(e.target.value)}
                className="pl-3 pr-3 py-2 bg-white rounded-md border border-slate-300 text-slate-700 text-sm font-normal leading-tight w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>
        <button
          className="inline-flex items-center gap-2 px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors duration-100 h-full"
          onClick={handleTwitterShare}
        >
          <Twitter className="w-4 h-4" />
          <span className="font-medium text-sm hidden md:block">Share</span>
        </button>
      </div>

      {selectedModelData && (
        <Card className="max-w-xl mx-auto mb-8 p-4">
          <CardHeader className="p-0 mb-4 mt-1">
            <CardTitle className="text-base font-medium leading-none flex items-center gap-2 text-slate-900">
              <Calculator className="w-4 h-4 text-slate-500 font-medium" />
              Model Cost Calculation
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-4 h-4 relative opacity-10"></div>
              <div className="text-slate-400 text-sm font-normal leading-tight">
                {selectedModelData.provider} {selectedModelData.model}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <div className="flex justify-between items-center pl-2">
              <span className="text-slate-700 text-sm font-medium leading-tight">
                Total Input Cost
              </span>
              <span className="text-slate-500 text-sm font-semibold">
                ${formatCost(selectedModelData.inputCost)}
              </span>
            </div>
            <div className="flex justify-between items-center pl-2">
              <span className="text-slate-400 text-sm font-normal leading-tight pb-2">
                Input Cost/1k Tokens
              </span>
              <span className="text-slate-400 text-sm font-normal">
                ${formatCost(selectedModelData.inputCostPer1k)}/1k Tokens
              </span>
            </div>
            <div className="h-[0px] border-t border-slate-100 pt-2"></div>
            <div className="flex justify-between items-center pl-2">
              <span className="text-slate-700 text-sm font-medium leading-tight">
                Total Output Cost
              </span>
              <span className="text-slate-500 text-sm font-semibold leading-4">
                ${formatCost(selectedModelData.outputCost)}
              </span>
            </div>
            <div className="flex justify-between items-center pl-2">
              <span className="text-slate-400 text-sm font-normal leading-tight pb-2">
                Output Cost/1k Tokens
              </span>
              <span className="text-slate-400 text-sm font-normal leading-4">
                ${formatCost(selectedModelData.outputCostPer1k)}/1k Tokens
              </span>
            </div>
            <div className="h-[0px] border-t border-slate-100 pt-2"></div>
            <div className="flex justify-between items-center pl-2">
              <span className="text-slate-700 text-base font-semibold leading-tight">
                Estimate Total Cost
              </span>
              <span className="text-sky-500 text-base font-bold leading-tight">
                ${formatCost(selectedModelData.totalCost)}
              </span>
            </div>

            <div className="pt-1"></div>

            <div className="flex bg-sky-50 border-sky-100 border-2 text-slate-500 font-medium rounded-lg justify-left items-left px-4 py-3 flex-col gap-1">
              <span>
                Helicone users save{" "}
                <span className="text-sky-500 font-bold">up to 70%</span> on
                their LLM costs...
              </span>
              <span className="text-slate-400 font-normal text-sm mb-1">
                by caching, improving prompts, fine-tuning, etc.
              </span>
              <div className="mt-2">
                <a
                  href="https://us.helicone.ai/signin"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get started for free
                  <svg
                    className="w-5 h-5 text-white ml-auto transform rotate-270"
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
      )}

      <div className="mt-12 p-6">
        <FilterSection
          providers={providerWithModels}
          selectedProviders={selectedProviders}
          selectedModels={selectedModels}
          onAddProvider={handleAddProvider}
          onRemoveProvider={handleRemoveProvider}
          onAddModel={handleAddModel}
          onRemoveModel={handleRemoveModel}
          onClearAll={handleClearAll}
        />

        <div className="w-full overflow-x-auto rounded-lg shadow-sm">
          <div className="min-w-[1000px]">
            <div className="max-h-[calc(200vh-600px)] overflow-y-auto">
              <table className="w-full divide-y divide-slate-200 border-separate border-spacing-0">
                <thead className="sticky top-0 bg-slate-100">
                  <tr>
                    <th
                      scope="col"
                      className="p-[24px] text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/6 bg-slate-100 border border-slate-200 first:rounded-tl-lg cursor-pointer"
                      onClick={() => requestSort("provider")}
                    >
                      Provider {getSortIcon("provider")}
                    </th>
                    <th
                      scope="col"
                      className="p-[24px] text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/6 bg-slate-100 border border-slate-200 cursor-pointer"
                      onClick={() => requestSort("model")}
                    >
                      Model {getSortIcon("model")}
                    </th>
                    <th
                      scope="col"
                      className="p-[24px] text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 cursor-pointer"
                      onClick={() => requestSort("inputCostPer1k")}
                    >
                      Input/1k <br />
                      Tokens {getSortIcon("inputCostPer1k")}
                    </th>
                    <th
                      scope="col"
                      className="p-[24px] text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 cursor-pointer"
                      onClick={() => requestSort("outputCostPer1k")}
                    >
                      Output/1k <br />
                      Tokens {getSortIcon("outputCostPer1k")}
                    </th>
                    <th
                      scope="col"
                      className="p-[24px] text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 cursor-pointer"
                      onClick={() => requestSort("inputCost")}
                    >
                      Input Cost {getSortIcon("inputCost")}
                    </th>
                    <th
                      scope="col"
                      className="p-[24px] text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 cursor-pointer"
                      onClick={() => requestSort("outputCost")}
                    >
                      Output Cost {getSortIcon("outputCost")}
                    </th>
                    <th
                      scope="col"
                      className="p-[24px] text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 last:rounded-tr-lg cursor-pointer"
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
                      className={`hover:bg-sky-50 transition-colors duration-150 ${
                        data.provider === selectedModelData?.provider &&
                        data.model === selectedModelData?.model
                          ? "bg-sky-100"
                          : ""
                      }`}
                    >
                      <td className="whitespace-nowrap text-sm text-slate-500 border border-slate-200 p-0">
                        <Link
                          href={`/llm-cost/provider/${encodeURIComponent(
                            data.provider.toLowerCase()
                          )}/model/${encodeURIComponent(data.model)}`}
                          className="block w-full h-full px-6 py-2"
                        >
                          {formatProviderName(data.provider)}
                        </Link>
                      </td>
                      <td className="text-sm text-slate-900 font-medium border border-slate-200 p-0">
                        <Link
                          href={`/llm-cost/provider/${encodeURIComponent(
                            data.provider.toLowerCase()
                          )}/model/${encodeURIComponent(data.model)}`}
                          className="block w-full h-full px-6 py-2"
                        >
                          <div className="break-words">{data.model}</div>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-sm text-slate-500 border border-slate-200 p-0">
                        <Link
                          href={`/llm-cost/provider/${encodeURIComponent(
                            data.provider.toLowerCase()
                          )}/model/${encodeURIComponent(data.model)}`}
                          className="block w-full h-full px-6 py-2"
                        >
                          ${formatCost(data.inputCostPer1k)}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-sm text-slate-500 border border-slate-200 p-0">
                        <Link
                          href={`/llm-cost/provider/${encodeURIComponent(
                            data.provider.toLowerCase()
                          )}/model/${encodeURIComponent(data.model)}`}
                          className="block w-full h-full px-6 py-2"
                        >
                          ${formatCost(data.outputCostPer1k)}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-sm text-slate-500 border border-slate-200 p-0">
                        <Link
                          href={`/llm-cost/provider/${encodeURIComponent(
                            data.provider.toLowerCase()
                          )}/model/${encodeURIComponent(data.model)}`}
                          className="block w-full h-full px-6 py-2"
                        >
                          ${formatCost(data.inputCost)}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-sm text-slate-500 border border-slate-200 p-0">
                        <Link
                          href={`/llm-cost/provider/${encodeURIComponent(
                            data.provider.toLowerCase()
                          )}/model/${encodeURIComponent(data.model)}`}
                          className="block w-full h-full px-6 py-2"
                        >
                          ${formatCost(data.outputCost)}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap text-sm font-medium text-sky-500 border border-slate-200 p-0">
                        <Link
                          href={`/llm-cost/provider/${encodeURIComponent(
                            data.provider.toLowerCase()
                          )}/model/${encodeURIComponent(data.model)}`}
                          className="block w-full h-full px-6 py-2"
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
      </div>

      <CalculatorInfo model={model} provider={provider} />
    </div>
  );
}
