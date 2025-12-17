"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { components } from "@/lib/clients/jawnTypes/public";

type ModelRegistryItem = components["schemas"]["ModelRegistryItem"];

interface ModelSearchDropdownProps {
  allModels: ModelRegistryItem[];
  placeholder?: string;
  onSelect?: (model: ModelRegistryItem) => void;
  navigateOnSelect?: boolean; // If true, clicking navigates to model page
  className?: string;
}

export function ModelSearchDropdown({
  allModels,
  placeholder = "Search models...",
  onSelect,
  navigateOnSelect = true,
  className = "",
}: ModelSearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allModels
      .filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.id.toLowerCase().includes(query) ||
          m.author.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [allModels, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (model: ModelRegistryItem) => {
    setSearchQuery("");
    setShowResults(false);
    if (onSelect) {
      onSelect(model);
    }
  };

  const formatCost = (model: ModelRegistryItem) => {
    if (!model.endpoints?.length) return "N/A";

    const costs = model.endpoints
      .filter((e) => e.pricing?.prompt !== undefined && e.pricing?.completion !== undefined)
      .map((e) => (e.pricing.prompt + e.pricing.completion) / 2);

    if (!costs.length) return "N/A";

    const minCost = Math.min(...costs);
    if (minCost === 0) return "Free";
    if (minCost < 1) return `$${minCost.toFixed(2)}/M`;
    return `$${minCost.toFixed(0)}/M`;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        className="pl-9 h-9 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700"
      />

      {/* Search results dropdown */}
      {showResults && filteredModels.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {filteredModels.map((model) =>
            navigateOnSelect ? (
              <Link
                key={model.id}
                href={`/model/${encodeURIComponent(model.id)}`}
                className="block px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => {
                  setSearchQuery("");
                  setShowResults(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {model.author}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {formatCost(model)}
                  </div>
                </div>
              </Link>
            ) : (
              <button
                key={model.id}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSelect(model)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {model.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {model.author}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {formatCost(model)}
                  </div>
                </div>
              </button>
            )
          )}
        </div>
      )}

      {/* No results message */}
      {showResults && searchQuery.trim() && filteredModels.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No models found
        </div>
      )}
    </div>
  );
}
