"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [firstModel, setFirstModel] = useState("");
  const [secondModel, setSecondModel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Get models from our registry adapter instead of hardcoding them
  const popularModels = getPopularModels();

  const filteredModels = popularModels.filter(
    (model) =>
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isCompareDisabled =
    !firstModel || !secondModel || firstModel === secondModel;

  return (
    <div className="min-h-screen bg-white px-4 py-12 flex flex-col items-center">
      {/* Header badges - match Hero.tsx style */}
      <div className="flex flex-wrap gap-x-12 gap-y-4 items-center mb-8">
        <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
          <p>Backed by</p>
          <img
            src="/static/home/yc-logo.webp"
            alt="Y Combinator"
            className="w-24 h-auto"
          />
        </div>
        <img
          src="/static/home/productoftheday.webp"
          alt="Product of the Day"
          className="w-32 h-auto"
        />
      </div>

      {/* Main heading - match Hero.tsx style */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl font-semibold mb-4">
          LLM Leaderboard <span className="text-brand">2025</span>
        </h1>

        <p className="text-lg text-landing-secondary font-light mb-6 px-4">
          Make data-driven decisions with real-world performance metrics from
          thousands of applications.
        </p>

        <Link href="#comparison">
          <button className="bg-brand py-3 px-6 text-base font-normal flex gap-3 rounded-lg text-white self-start items-center mx-auto">
            Start comparing models
            <ArrowRightIcon size={16} strokeWidth={2.33} />
          </button>
        </Link>
      </div>

      {/* Model selector card */}
      <div id="comparison" className="max-w-4xl mx-auto mt-12">
        <Card className="p-6 md:p-8 border border-gray-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-6">
            Select models to compare
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">
                First Model
              </label>
              <Select value={firstModel} onValueChange={setFirstModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Second Model
              </label>
              <Select value={secondModel} onValueChange={setSecondModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
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

          <div className="flex justify-center">
            <Link
              href={
                !isCompareDisabled
                  ? createComparisonPath(firstModel, secondModel)
                  : "#"
              }
              passHref
            >
              <button
                disabled={isCompareDisabled}
                className={`bg-brand py-2 px-6 text-base font-normal flex gap-2 rounded-lg text-white items-center ${
                  isCompareDisabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Compare Models{" "}
                <ArrowRightIcon className="h-4 w-4" strokeWidth={2.33} />
              </button>
            </Link>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Or browse all models</h3>
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
                  onClick={() => {
                    if (!firstModel) {
                      setFirstModel(model.id);
                    } else if (!secondModel && firstModel !== model.id) {
                      setSecondModel(model.id);
                    } else if (firstModel === model.id) {
                      setFirstModel("");
                    } else if (secondModel === model.id) {
                      setSecondModel("");
                    }
                  }}
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
          </div>
        </Card>
      </div>
    </div>
  );
}
