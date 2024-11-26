"use client";
import { providers } from "@/packages/cost/providers/mappings";
import Link from "next/link";
import { useState, useMemo } from "react";

// Move data processing outside component
const mainProviders = providers.filter((provider) =>
  [
    "OPENAI",
    "ANTHROPIC",
    "TOGETHER",
    "FIREWORKS",
    "PERPLEXITY",
    "GOOGLE",
    "OPENROUTER",
    "GROQ",
    // "COHERE",
    // "MISTRAL",
    // "DEEPINFRA",
    // "FIRECRAWL",
    // "QSTASH",
  ].includes(provider.provider)
);

// Pre-compute available models and their providers (moved outside component)
const modelProvidersMap = new Map<string, string>();
const modelSet = new Set<string>();

mainProviders.forEach((provider) => {
  if (provider.costs) {
    provider.costs.forEach((cost) => {
      const model = cost.model.value;
      modelSet.add(model);

      const currentProviders = modelProvidersMap.get(model) || "";
      modelProvidersMap.set(
        model,
        currentProviders
          ? `${currentProviders}, ${provider.provider}`
          : provider.provider
      );
    });
  }
});

const availableModels = Array.from(modelSet);

export default function ComparisonIndexPage() {
  const [model1, setModel1] = useState("");
  const [model2, setModel2] = useState("");
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");

  const filteredModels1 = useMemo(
    () =>
      availableModels
        .filter((model) => model.toLowerCase().includes(search1.toLowerCase()))
        .slice(0, 10),
    [search1]
  );

  const filteredModels2 = useMemo(
    () =>
      availableModels
        .filter((model) => model.toLowerCase().includes(search2.toLowerCase()))
        .slice(0, 10),
    [search2]
  );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Model Comparisons</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search first model..."
            className="w-full p-2 border rounded"
            value={search1}
            onChange={(e) => setSearch1(e.target.value)}
          />
          {search1 && (
            <div className="mt-2 border rounded max-h-60 overflow-y-auto">
              {filteredModels1.map((model) => (
                <div
                  key={model}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setModel1(model);
                    setSearch1("");
                  }}
                >
                  <div>{model}</div>
                  <div className="text-sm text-gray-600">
                    {modelProvidersMap.get(model)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {model1 && (
            <div className="mt-2 p-2 border rounded">
              <div className="font-semibold">Selected: {model1}</div>
              <div className="text-sm text-gray-600">
                {modelProvidersMap.get(model1)}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            type="text"
            placeholder="Search second model..."
            className="w-full p-2 border rounded"
            value={search2}
            onChange={(e) => setSearch2(e.target.value)}
          />
          {search2 && (
            <div className="mt-2 border rounded max-h-60 overflow-y-auto">
              {filteredModels2.map((model) => (
                <div
                  key={model}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setModel2(model);
                    setSearch2("");
                  }}
                >
                  <div>{model}</div>
                  <div className="text-sm text-gray-600">
                    {modelProvidersMap.get(model)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {model2 && (
            <div className="mt-2 p-2 border rounded">
              <div className="font-semibold">Selected: {model2}</div>
              <div className="text-sm text-gray-600">
                {modelProvidersMap.get(model2)}
              </div>
            </div>
          )}
        </div>
      </div>

      {model1 && model2 && (
        <div className="text-center mt-8">
          <Link
            href={`/comparison/${encodeURIComponent(
              model1
            )}-vs-${encodeURIComponent(model2)}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors"
          >
            Compare {model1} vs {model2}
          </Link>
        </div>
      )}
    </div>
  );
}
