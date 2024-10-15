"use client";

import { useState, useEffect } from "react";
import { Table, Zap } from "lucide-react";
import { costOf, costOfPrompt } from "../../packages/cost"; // Ensure the path is correct
import { providers } from "../../packages/cost/providers/mappings"; // Ensure the path is correct
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Function to format provider names
function formatProviderName(provider: string): string {
  const formattingMap: { [key: string]: string } = {
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
    AZURE: "Azure",
    TOGETHER: "Together AI",
    FIREWORKS: "Fireworks",
    OPENROUTER: "OpenRouter",
    GROQ: "Groq",
    QSTASH: "Qstash",
    MISTRAL: "Mistral",
  };

  return formattingMap[provider.toUpperCase()] || provider.toUpperCase();
}

type ModelPriceCalculatorProps = {
  model: string;
  provider: string;
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

// Function to sanitize model names for URL
function sanitizeModelName(name: string): string {
  return name.replace(/[\/\\]/g, "-");
}

// Update this function to include the provider in the URL
function sanitizeForUrl(name: string): string {
  return name.replace(/[\/\\]/g, "-").toLowerCase();
}

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
  const router = useRouter();

  /**
   * Formats the cost to avoid floating-point precision issues.
   * Uses exponential notation for very small numbers.
   */
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

  // Add this function to handle model selection
  const setSelectedModel = (data: CostData) => {
    setSelectedModelData(data);
  };

  const handleModelSelect = (data: CostData) => {
    setSelectedModelData(data);
    const sanitizedProviderName = sanitizeForUrl(data.provider);
    const sanitizedModelName = sanitizeForUrl(data.model);
    router.push(
      `/price-calc/provider/${sanitizedProviderName}/model/${sanitizedModelName}`
    );
    // Add this line to scroll to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // Find and set the initially selected model based on props
    const initialSelectedModel = costData.find(
      (data) =>
        data.model.toLowerCase() === model.toLowerCase() &&
        data.provider.toLowerCase() === provider.toLowerCase()
    );
    if (initialSelectedModel) {
      setSelectedModelData(initialSelectedModel);
    }
  }, [costData, model, provider]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="text-center mb-8">
        <Image
          src="/static/community/shiny-cube.webp"
          alt="Shiny Cube"
          width={100}
          height={100}
          className="mx-auto mb-4"
        />
        <h2 className="text-3xl font-semibold text-gray-800 mb-2">
          {formatProviderName(provider)} {model} Pricing Calculator
        </h2>
        <p className="text-gray-600">
          Calculate the cost of using <strong>{model}</strong> with our pricing
          tool
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-2">
          <Label htmlFor="inputTokens">Prompt Tokens</Label>
          <div className="relative">
            <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="inputTokens"
              type="number"
              value={inputTokens}
              onChange={(e) => setInputTokens(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="outputTokens">Output Tokens</Label>
          <div className="relative">
            <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="outputTokens"
              type="number"
              value={outputTokens}
              onChange={(e) => setOutputTokens(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Selected Model Details */}
      {selectedModelData && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Selected Model: {formatProviderName(selectedModelData.provider)}{" "}
            {selectedModelData.model}
          </h3>
          <div className="space-y-3">
            {/* Input Cost per 1K Tokens */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Input Cost per 1K Tokens:</span>
              <span className="text-gray-700">
                ${formatCost(selectedModelData.inputCostPer1k)}/1K tokens
              </span>
            </div>
            {/* Output Cost per 1K Tokens */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Output Cost per 1K Tokens:</span>
              <span className="text-gray-700">
                ${formatCost(selectedModelData.outputCostPer1k)}/1K tokens
              </span>
            </div>
            {/* Total Input Cost */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Input Cost:</span>
              <span className="text-gray-700">
                ${formatCost(selectedModelData.inputCost)}
              </span>
            </div>
            {/* Total Output Cost */}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total Output Cost:</span>
              <span className="text-gray-700">
                ${formatCost(selectedModelData.outputCost)}
              </span>
            </div>
            {/* Estimated Total Cost */}
            <div className="flex justify-between items-center border-t pt-4">
              <span className="text-gray-500">Estimated Total Cost:</span>
              <span className="text-blue-600 font-semibold">
                ${formatCost(selectedModelData.totalCost)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Provider",
                  "Model",
                  "Input/1K",
                  "Output/1K",
                  "Input Cost",
                  "Output Cost",
                  "Total Cost",
                ].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {costData.map((data, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    data.provider === selectedModelData?.provider &&
                    data.model === selectedModelData?.model
                      ? "bg-sky-50"
                      : ""
                  }`}
                  onClick={() => handleModelSelect(data)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatProviderName(data.provider)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    <div className="break-words">{data.model}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatCost(data.inputCostPer1k)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatCost(data.outputCostPer1k)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatCost(data.inputCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${formatCost(data.outputCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-sky-500">
                    ${formatCost(data.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InputField({
  id,
  label,
  value,
  onChange,
  icon,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {icon}
        </div>
        <input
          type="number"
          id={id}
          className="block w-full pl-10 pr-3 py-2 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
