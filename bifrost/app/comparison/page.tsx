"use client";
import { providers } from "@/packages/cost/providers/mappings";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";

// Filter main providers
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
  ].includes(provider.provider)
);

// Pre-compute model data
const modelData = new Map<string, { provider: string }>();

mainProviders.forEach((provider) => {
  provider.costs?.forEach((cost) => {
    const model = cost.model.value;
    modelData.set(model, {
      provider: provider.provider.toLowerCase(),
    });
  });
});

const availableModels = Array.from(modelData.keys());

const popularComparisons = [
  ["gpt-4", "claude-3-opus"],
  ["gpt-4-turbo", "claude-3-sonnet"],
  ["gpt-3.5-turbo", "claude-3-haiku"],
  ["gemini-pro", "gpt-4"],
];

export default function ComparisonIndexPage() {
  const [model1, setModel1] = useState("");
  const [model2, setModel2] = useState("");
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");

  const filteredModels1 = useMemo(
    () =>
      availableModels
        .filter(
          (model) =>
            model.toLowerCase().includes(search1.toLowerCase()) &&
            model !== model2
        )
        .slice(0, 10),
    [search1, model2]
  );

  const filteredModels2 = useMemo(
    () =>
      availableModels
        .filter(
          (model) =>
            model.toLowerCase().includes(search2.toLowerCase()) &&
            model !== model1
        )
        .slice(0, 10),
    [search2, model1]
  );

  const createComparisonPath = (model1: string, model2: string) => {
    const data1 = modelData.get(model1);
    const data2 = modelData.get(model2);
    if (!data1 || !data2) return "";

    const model1Path = `${encodeURIComponent(model1)}-on-${encodeURIComponent(
      data1.provider
    )}`;
    const model2Path = `${encodeURIComponent(model2)}-on-${encodeURIComponent(
      data2.provider
    )}`;
    return `/comparison/${model1Path}-vs-${model2Path}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">LLM Battle</h1>
        <p className="text-gray-600">
          Compare performance metrics between different language models
        </p>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Popular Comparisons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {popularComparisons.map(([model1, model2]) => (
            <Link
              key={`${model1}-${model2}`}
              href={createComparisonPath(model1, model2)}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{model1}</span>
                <span className="text-gray-500">vs</span>
                <span className="font-medium">{model2}</span>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Comparison</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Model
            </label>
            <input
              type="text"
              placeholder="Search models..."
              className="w-full p-2 border rounded-lg mb-2"
              value={search1}
              onChange={(e) => setSearch1(e.target.value)}
            />
            {search1 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {filteredModels1.map((model) => {
                  const data = modelData.get(model);
                  return (
                    <div
                      key={model}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setModel1(model);
                        setSearch1("");
                      }}
                    >
                      <div className="font-medium">{model}</div>
                      <div className="text-sm text-gray-600">
                        {data?.provider.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {model1 && !search1 && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="font-medium">{model1}</div>
                <div className="text-sm text-gray-600">
                  {modelData.get(model1)?.provider.toUpperCase()}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Second Model
            </label>
            <input
              type="text"
              placeholder="Search models..."
              className="w-full p-2 border rounded-lg mb-2"
              value={search2}
              onChange={(e) => setSearch2(e.target.value)}
            />
            {search2 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                {filteredModels2.map((model) => {
                  const data = modelData.get(model);
                  return (
                    <div
                      key={model}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setModel2(model);
                        setSearch2("");
                      }}
                    >
                      <div className="font-medium">{model}</div>
                      <div className="text-sm text-gray-600">
                        {data?.provider.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {model2 && !search2 && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="font-medium">{model2}</div>
                <div className="text-sm text-gray-600">
                  {modelData.get(model2)?.provider.toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        {model1 && model2 && (
          <div className="mt-6 text-center">
            <Link
              href={createComparisonPath(model1, model2)}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-colors"
            >
              Compare Models
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
