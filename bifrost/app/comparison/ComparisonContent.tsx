"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import the new adapter functions
import { getPopularModels, createComparisonPath } from "@/lib/models/registry";

export default function ComparisonContent() {
  // Get models from our registry adapter for initialization
  const popularModels = getPopularModels();

  // Find the Claude model ID by looking for "claude" in the name
  const claudeModelId =
    popularModels.find(
      (m) =>
        m.name.toLowerCase().includes("claude") &&
        m.name.toLowerCase().includes("sonnet"),
    )?.id || "";

  // Find the GPT-4o model ID to ensure it exists
  const gpt4oModelId =
    popularModels.find(
      (m) =>
        m.name.toLowerCase().includes("gpt-4o") ||
        m.name.toLowerCase().includes("gpt4o"),
    )?.id || "";

  // Pre-select models if they exist in the registry
  const [firstModel, setFirstModel] = useState(gpt4oModelId);
  const [secondModel, setSecondModel] = useState(claudeModelId);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredModels = popularModels.filter(
    (model) =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const isCompareDisabled =
    !firstModel || !secondModel || firstModel === secondModel;

  // Handle navigation when both models are selected
  useEffect(() => {
    // Disabled automatic navigation since we now have the button
    // This useEffect can be used for other initialization if needed
  }, [firstModel, secondModel, router]);

  // Handle second model selection (also used for card clicks)
  const handleSecondModelSelect = (modelId: string) => {
    if (modelId === firstModel) return; // Prevent selecting the same model
    setSecondModel(modelId);
  };

  // Handle model card clicks with the same logic
  const handleModelCardClick = (modelId: string) => {
    if (!firstModel) {
      setFirstModel(modelId);
    } else if (firstModel !== modelId) {
      // If first model is set and this is a different model, set as second and navigate
      handleSecondModelSelect(modelId);
    } else if (firstModel === modelId) {
      setFirstModel("");
    } else if (secondModel === modelId) {
      setSecondModel("");
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-4 flex flex-col items-center">
      {/* LLM Leaderboard Image */}
      <div className="container mx-auto max-w-4xl pb-2 text-center">
        <img
          src="/static/llmleaderboard.webp"
          alt="LLM Leaderboard"
          className="mx-auto max-w-[150px] h-auto"
        />
      </div>

      {/* Main heading - match Hero.tsx style */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-semibold mb-4">
          LLM Leaderboard <span className="text-brand">2025</span>
        </h1>

        <p className="text-lg text-landing-secondary font-light mb-6 px-4">
          Make data-driven decisions with real-world performance metrics from
          thousands of applications.
        </p>

        {/* Simple model selector right here */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 max-w-2xl mx-auto">
          <div className="w-full sm:w-[44%]">
            <Select value={firstModel} onValueChange={setFirstModel}>
              <SelectTrigger className="w-full h-10 text-sm">
                <SelectValue placeholder="Select first model" />
              </SelectTrigger>
              <SelectContent>
                {popularModels.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    disabled={model.id === secondModel}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={model.logo}
                        alt={`${model.provider} logo`}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-shrink-0 text-md px-2 font-bold">VS</div>

          <div className="w-full sm:w-[44%]">
            <Select value={secondModel} onValueChange={handleSecondModelSelect}>
              <SelectTrigger className="w-full h-10 text-sm">
                <SelectValue placeholder="Select second model" />
              </SelectTrigger>
              <SelectContent>
                {popularModels.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    disabled={model.id === firstModel}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={model.logo}
                        alt={`${model.provider} logo`}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Compare button */}
        <Link
          href={
            !isCompareDisabled
              ? createComparisonPath(firstModel, secondModel)
              : "#"
          }
          className="inline-block mb-6"
        >
          <button
            disabled={isCompareDisabled}
            className={`bg-brand py-2 px-6 text-sm font-medium flex gap-2 rounded-md items-center text-white ${
              isCompareDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            Compare Models <ArrowRightIcon size={16} strokeWidth={2.33} />
          </button>
        </Link>
      </div>

      {/* Full model selector card */}
      <div id="comparison" className="max-w-4xl mx-auto mt-12">
        <Card className="p-6 md:p-8 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-6">Browse all models</h2>

          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search models..."
                className="pl-8 w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleModelCardClick(model.id)}
              >
                <div
                  className={`flex items-center gap-2 ${
                    firstModel === model.id || secondModel === model.id
                      ? "text-brand font-medium"
                      : ""
                  }`}
                >
                  <img
                    src={model.logo}
                    alt={`${model.provider} logo`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium truncate">
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {model.provider}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
