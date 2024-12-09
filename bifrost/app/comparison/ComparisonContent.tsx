"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import ModelSelector from "./ModelSelector";

const popularComparisons = [
  ["gpt-4", "claude-3-opus"],
  ["gpt-4-turbo", "claude-3-sonnet"],
  ["gpt-3.5-turbo", "claude-3-haiku"],
  ["gemini-pro", "gpt-4"],
];

export default function ComparisonContent() {
  // Initialize with empty strings to ensure consistent client/server rendering
  const [model1, setModel1] = useState<string>("");
  const [model2, setModel2] = useState<string>("");
  const [provider1, setProvider1] = useState<string>("");
  const [provider2, setProvider2] = useState<string>("");

  const createComparisonPath = (
    model1: string,
    provider1: string,
    model2: string,
    provider2: string
  ) => {
    const model1Path = `${encodeURIComponent(model1)}-on-${encodeURIComponent(
      provider1
    )}`;
    const model2Path = `${encodeURIComponent(model2)}-on-${encodeURIComponent(
      provider2
    )}`;

    return `/comparison/${model1Path}-vs-${model2Path}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">LLM Leaderboard</h1>
        <p className="text-gray-600">
          Compare performance metrics between different language models
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Comparison</h2>
        <ModelSelector
          modelA={model1}
          modelB={model2}
          providerA={provider1}
          providerB={provider2}
        />
      </Card>

      <Card className="p-6 mt-8">
        <h2 className="text-xl font-semibold mb-4">Popular Comparisons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popularComparisons.map(([model1, model2]) => (
            <Link
              key={`${model1}-${model2}`}
              href={createComparisonPath(
                model1,
                provider1 || "openai",
                model2,
                provider2 || "anthropic"
              )}
              className="group"
            >
              <div className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between space-x-4">
                  <span className="px-3 py-1 bg-red-50 text-red-600 rounded-md font-medium text-sm">
                    {model1}
                  </span>
                  <span className="text-gray-400 text-sm font-medium">vs</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md font-medium text-sm">
                    {model2}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
