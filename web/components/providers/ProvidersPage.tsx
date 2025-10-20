import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Small } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SortOption } from "@/types/provider";
import { providers, recentlyUsedProviderIds } from "@/data/providers";
import { ProviderCard } from "@/components/providers/ProviderCard";
import {
  filterProviders,
  filterPubliclyVisibleProviders,
  sortProviders,
} from "@/utils/providerUtils";
import FoldedHeader from "../shared/FoldedHeader";
import { useOrg } from "@/components/layout/org/organizationContext";

export const ProvidersPage: React.FC = () => {
  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const org = useOrg();

  // Filter and sort the providers based on user selections
  const filteredProviders = sortProviders(
    filterProviders(
      filterPubliclyVisibleProviders(providers, org?.currentOrg?.id),
      searchQuery,
    ),
    sortOption,
    recentlyUsedProviderIds,
  );

  return (
    <main className="flex w-full animate-fade-in flex-col">
      <FoldedHeader
        showFold={false}
        leftSection={
          <Small className="font-bold text-gray-500 dark:text-slate-300">
            Providers
          </Small>
        }
      />
      <div className="flex flex-col gap-4 p-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex min-w-[150px] items-center justify-between gap-1"
              >
                <span>
                  Sort:{" "}
                  {sortOption === "relevance"
                    ? "Relevance"
                    : sortOption === "alphabetical"
                      ? "A-Z"
                      : "Recently Used"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortOption("relevance")}>
                Relevance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("alphabetical")}>
                Alphabetical (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("recently-used")}>
                Recently Used
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {filteredProviders.length === 0 ? (
            <div className="col-span-full py-6 text-center text-muted-foreground">
              No providers found matching your search.
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default ProvidersPage;
