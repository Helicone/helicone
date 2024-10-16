"use client";

import { useState, useEffect } from "react";
import { Calculator, Twitter } from "lucide-react";
import { costOf, costOfPrompt } from "../../packages/cost"; // Ensure the path is correct
import { providers } from "../../packages/cost/providers/mappings"; // Ensure the path is correct
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

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
  const [showAllResults, setShowAllResults] = useState(false);

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

  const handleModelSelect = (data: CostData) => {
    setSelectedModelData(data);
    const sanitizedProviderName = encodeURIComponent(data.provider);
    const sanitizedModelName = encodeURIComponent(data.model);
    router.push(
      `/llm-cost/provider/${sanitizedProviderName}/model/${sanitizedModelName}`
    );
    // Add this line to scroll to the top of the page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // Find and set the initially selected model based on props
    if (model && provider) {
      const initialSelectedModel = costData.find(
        (data) =>
          data.model.toLowerCase() === model.toLowerCase() &&
          data.provider.toLowerCase() === provider.toLowerCase()
      );
      if (initialSelectedModel) {
        setSelectedModelData(initialSelectedModel);
      }
    }
  }, [costData, model, provider]);

  const visibleCostData = showAllResults ? costData : costData.slice(0, 20);

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
        <h2 className="text-4xl font-semibold text-gray-800 mb-2">
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
        </h2>
        <p className="text-gray-600 mb-4">
          {provider && model
            ? `Calculate the cost of using ${model} with Helicone's free pricing tool.`
            : "Calculate the cost of using AI models with Helicone's free pricing tool."}
        </p>

        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
          onClick={handleTwitterShare}
        >
          <Twitter className="w-5 h-5" />
          <span className="font-medium">Share</span>
        </button>
      </div>

      <div className="max-w-xl mx-auto h-9 flex justify-start items-start gap-6 mb-6">
        <div className="grow shrink basis-0 h-9 flex justify-start items-center gap-4">
          <Label
            htmlFor="inputTokens"
            className="text-black text-sm font-medium leading-tight"
          >
            Input Tokens
          </Label>
          <div className="grow shrink basis-0 self-stretch relative">
            <Input
              id="inputTokens"
              type="number"
              value={inputTokens}
              onChange={(e) => setInputTokens(e.target.value)}
              className="pl-3 pr-3 py-2 bg-white rounded-md border border-slate-300 text-slate-900 text-sm font-normal leading-tight w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
        <div className="grow shrink basis-0 h-9 flex justify-start items-center gap-4">
          <Label
            htmlFor="outputTokens"
            className="text-black text-sm font-medium leading-tight"
          >
            Output tokens
          </Label>
          <div className="grow shrink basis-0 bg-[#f8feff] flex-col justify-start items-start gap-1.5 inline-flex">
            <div className="self-stretch relative w-full">
              <Input
                id="outputTokens"
                type="number"
                value={outputTokens}
                onChange={(e) => setOutputTokens(e.target.value)}
                className="pl-3 pr-3 py-2 bg-slate-50 rounded-md border border-slate-300 text-slate-900 text-sm font-normal leading-tight w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>
      </div>

      {selectedModelData && (
        <Card className="max-w-xl mx-auto mb-8 p-[17px] h-[309px]">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="text-base font-medium leading-none flex items-center gap-2">
              <Calculator className="w-4 h-4 text-gray-500" />
              Model Cost Calculation
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-3.5 h-3.5 relative opacity-10"></div>
              <div className="text-slate-400 text-sm font-normal leading-tight">
                {selectedModelData.provider} {selectedModelData.model}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-[9px]">
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-700 text-sm font-medium leading-tight">
                Total Input Cost
              </span>
              <span className="text-sky-500 text-sm font-semibold leading-[16.80px]">
                ${formatCost(selectedModelData.inputCost)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400 text-sm font-medium leading-tight">
                Input Cost/1k tokens
              </span>
              <span className="text-slate-400 text-sm font-medium leading-[16.80px]">
                ${formatCost(selectedModelData.inputCostPer1k)}/1k tokens
              </span>
            </div>
            <div className="h-[0px] border-t border-slate-100"></div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-700 text-sm font-medium leading-tight">
                Total Output Cost
              </span>
              <span className="text-sky-500 text-sm font-semibold leading-[16.80px]">
                ${formatCost(selectedModelData.outputCost)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-400 text-sm font-medium leading-tight">
                Output Cost/1k tokens
              </span>
              <span className="text-slate-400 text-sm font-medium leading-[16.80px]">
                ${formatCost(selectedModelData.outputCostPer1k)}/1k tokens
              </span>
            </div>
            <div className="h-[0px] border-t border-slate-100"></div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-700 text-base font-semibold leading-tight">
                Estimate Total Cost
              </span>
              <span className="text-sky-500 text-base font-bold leading-tight">
                ${formatCost(selectedModelData.totalCost)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <h3 className="text-2xl font-semibold mb-4">
        {model && provider ? "Other models" : "All models"}
      </h3>
      <div className="w-full overflow-x-auto rounded-lg shadow-sm">
        <div className="min-w-[1000px]">
          {" "}
          {/* Add this wrapper div */}
          <table className="w-full divide-y divide-gray-200 border-separate border-spacing-0">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="p-[24px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 bg-slate-100 border border-gray-200 first:rounded-tl-lg"
                >
                  Provider
                </th>
                <th
                  scope="col"
                  className="p-[24px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 bg-slate-100 border border-gray-200"
                >
                  Model
                </th>
                <th
                  scope="col"
                  className="p-[24px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-slate-100 border border-gray-200"
                >
                  Input/1k <br />
                  Tokens
                </th>
                <th
                  scope="col"
                  className="p-[24px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-slate-100 border border-gray-200"
                >
                  Output/1k <br />
                  Tokens
                </th>
                <th
                  scope="col"
                  className="p-[24px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-slate-100 border border-gray-200"
                >
                  Input Cost
                </th>
                <th
                  scope="col"
                  className="p-[24px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-slate-100 border border-gray-200"
                >
                  Output Cost
                </th>
                <th
                  scope="col"
                  className="p-[24px] text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-slate-100 border border-gray-200 last:rounded-tr-lg"
                >
                  Total Cost
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visibleCostData.map((data, index) => (
                <tr
                  key={index}
                  className={`hover:bg-sky-50 cursor-pointer transition-colors duration-150 ${
                    data.provider === selectedModelData?.provider &&
                    data.model === selectedModelData?.model
                      ? "bg-sky-100"
                      : ""
                  }`}
                  onClick={() => handleModelSelect(data)}
                >
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                    {formatProviderName(data.provider)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-900 font-medium border border-gray-200">
                    <div className="break-words">{data.model}</div>
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                    ${formatCost(data.inputCostPer1k)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                    ${formatCost(data.outputCostPer1k)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                    ${formatCost(data.inputCost)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                    ${formatCost(data.outputCost)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-sky-500 border border-gray-200">
                    ${formatCost(data.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!showAllResults && costData.length > 20 && (
        <div className="mt-4 text-center">
          <Button onClick={() => setShowAllResults(true)} variant="outline">
            See More
          </Button>
        </div>
      )}

      <div className="mt-12 space-y-8 max-w-3xl mx-auto">
        <section>
          <h3 className="text-2xl font-semibold mb-4">
            What is the {model ? `${model} ` : ""}Pricing Calculator?
          </h3>
          <p>Placeholder text.</p>
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-4">
            Top Benefits of the {model ? `${model} ` : ""}Pricing Calculator
          </h3>
          <p>Placeholder text.</p>
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-4">
            Tips to Use of {model ? `${model} ` : ""}Pricing Calculator
          </h3>
          <p>Placeholder text.</p>
        </section>

        <section>
          <h3 className="text-2xl font-semibold mb-4">
            Frequently asked questions
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {[1, 2, 3, 4].map((num) => (
              <AccordionItem key={num} value={`faq-${num}`}>
                <AccordionTrigger>FAQ {num}</AccordionTrigger>
                <AccordionContent>Placeholder text.</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
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
