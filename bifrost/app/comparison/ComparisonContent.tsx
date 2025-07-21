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
        m.name.toLowerCase().includes("sonnet")
    )?.id || "";

  // Find the GPT-4o model ID to ensure it exists
  const gpt4oModelId =
    popularModels.find(
      (m) =>
        m.name.toLowerCase().includes("gpt-4o") ||
        m.name.toLowerCase().includes("gpt4o")
    )?.id || "";

  // Pre-select models if they exist in the registry
  const [firstModel, setFirstModel] = useState(gpt4oModelId);
  const [secondModel, setSecondModel] = useState(claudeModelId);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const filteredModels = popularModels.filter(
    (model) =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="flex min-h-screen flex-col items-center bg-white px-4 py-4">
      {/* LLM Leaderboard Image */}
      <div className="container mx-auto max-w-4xl pb-2 text-center">
        <img
          src="/static/llmleaderboard.webp"
          alt="LLM Leaderboard"
          className="mx-auto h-auto max-w-[150px]"
        />
      </div>

      {/* Main heading - match Hero.tsx style */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="mb-4 text-4xl font-semibold">
          LLM Leaderboard <span className="text-brand">2025</span>
        </h1>

        <p className="text-landing-secondary mb-6 px-4 text-lg font-light">
          Make data-driven decisions with real-world performance metrics from
          thousands of applications.
        </p>

        {/* Simple model selector right here */}
        <div className="mx-auto mb-6 flex max-w-2xl flex-col items-center justify-center gap-4 sm:flex-row">
          <div className="w-full sm:w-[44%]">
            <Select value={firstModel} onValueChange={setFirstModel}>
              <SelectTrigger className="h-10 w-full text-sm">
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
                        className="h-5 w-5 rounded-full object-cover"
                      />
                      <span>{model.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-md flex-shrink-0 px-2 font-bold">VS</div>

          <div className="w-full sm:w-[44%]">
            <Select value={secondModel} onValueChange={handleSecondModelSelect}>
              <SelectTrigger className="h-10 w-full text-sm">
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
                        className="h-5 w-5 rounded-full object-cover"
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
          className="mb-6 inline-block"
        >
          <button
            disabled={isCompareDisabled}
            className={`bg-brand flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium text-white ${
              isCompareDisabled ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            Compare Models <ArrowRightIcon size={16} strokeWidth={2.33} />
          </button>
        </Link>
      </div>

      {/* Full model selector card */}
      <div id="comparison" className="mx-auto mt-12 max-w-4xl">
        <Card className="rounded-lg border border-gray-200 p-6 md:p-8">
          <h2 className="mb-6 text-xl font-semibold">Browse all models</h2>

          <div className="mb-4 flex items-center justify-between">
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search models..."
                className="w-[200px] pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-50"
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
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="truncate text-sm font-medium">
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
