"use client";

import { clsx } from "@/components/shared/utils";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface BlogFilterProps {
  badges: string[];
}

export default function BlogFilter({ badges }: BlogFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get values from URL instead of local state
  const activeFilter = searchParams.get("category") || "all";
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");

  // Add "all" to the beginning of the filters list
  const filters = ["all", ...badges].filter((value, index, self) => {
    return self.indexOf(value) === index;
  });

  // Update URL when filter changes
  const handleFilterClick = (filter: string) => {
    const params = new URLSearchParams(searchParams);

    if (filter === "all") {
      params.delete("category");
    } else {
      params.set("category", filter);
    }

    router.push(`/blog?${params.toString()}`);
  };

  // Update URL when search changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (searchTerm) {
        params.set("q", searchTerm);
      } else {
        params.delete("q");
      }

      router.push(`/blog?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchParams, router]);

  return (
    <div className="mb-6 overflow-x-auto pb-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-max gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterClick(filter)}
              className={clsx(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                activeFilter === filter
                  ? "bg-sky-200 text-sky-700"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {filter === "all"
                ? "All"
                : filter
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
            </button>
          ))}
        </div>
        <div className="relative min-w-[200px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search blog posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-slate-200 py-1 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>
    </div>
  );
}
