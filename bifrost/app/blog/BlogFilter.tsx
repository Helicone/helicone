"use client";

import { clsx } from "@/components/shared/utils";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

interface BlogFilterProps {
    badges: string[];
}

export default function BlogFilter({ badges }: BlogFilterProps) {
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debugMode, setDebugMode] = useState<boolean>(false);

    // Add "all" to the beginning of the filters list
    const filters = ["all", ...badges].filter((value, index, self) => {
        return self.indexOf(value) === index;
    });

    useEffect(() => {
        // Get all blog post elements
        const blogPosts = document.querySelectorAll("[id='regular']");
        const featuredPost = document.querySelector("[id='featured']");

        // Always keep featured post visible
        if (featuredPost) {
            (featuredPost as HTMLElement).style.display = "flex";
        }

        // Toggle debug mode with Alt+D key combination
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === 'd') {
                setDebugMode(prev => !prev);
                console.log("Debug mode:", !debugMode);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Filter posts based on both activeFilter and searchTerm
        blogPosts.forEach((post) => {
            let showByFilter = activeFilter === "all";
            let showBySearch = searchTerm === "";

            // Check if post matches the active filter badge
            if (!showByFilter) {
                const badgeContainer = post.querySelector(".flex.items-center.gap-2.text-slate-500.text-sm");
                if (badgeContainer) {
                    const badgeSpan = badgeContainer.querySelector("span:first-child");
                    const badgeText = badgeSpan?.textContent?.toLowerCase() || "";

                    if (debugMode) {
                        console.log("Regular post badge:", badgeText);
                    }

                    showByFilter = badgeText === activeFilter.toLowerCase();
                }
            }

            // Check if post title contains the search term
            if (!showBySearch) {
                const titleElement = post.querySelector("h2, h3");
                if (titleElement) {
                    const titleText = titleElement.textContent?.toLowerCase() || "";
                    showBySearch = titleText.includes(searchTerm.toLowerCase());

                    if (debugMode) {
                        console.log("Post title:", titleText, "Search term:", searchTerm);
                    }
                }
            }

            // Show post if it matches both filter and search criteria
            (post as HTMLElement).style.display = (showByFilter && showBySearch) ? "flex" : "none";
        });

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeFilter, searchTerm, debugMode]);

    return (
        <div className="overflow-x-auto pb-2 mb-6">
            <div className="flex justify-between items-center gap-4">
                <div className="flex gap-2 min-w-max">
                    {filters.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={clsx(
                                "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                                activeFilter === filter
                                    ? "bg-sky-200 text-sky-700"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            )}
                        >
                            {filter === "all" ? "All" : filter.split('-').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                        </button>
                    ))}
                </div>
                <div className="relative min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search blog posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-1 pl-9 pr-3 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                    />
                </div>
            </div>
        </div>
    );
} 