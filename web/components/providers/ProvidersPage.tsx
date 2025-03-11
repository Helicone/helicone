import React, { useState } from "react";
import AuthLayout from "@/components/layout/auth/authLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { H1 } from "@/components/ui/typography";
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
import { filterProviders, sortProviders } from "@/utils/providerUtils";

export const ProvidersPage: React.FC = () => {
  // Local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");

  // Filter and sort the providers based on user selections
  const filteredProviders = sortProviders(
    filterProviders(providers, searchQuery),
    sortOption,
    recentlyUsedProviderIds
  );

  return (
    <AuthLayout>
      <div className="flex flex-col gap-4 max-w-5xl mx-auto">
        <H1>Provider API Keys</H1>

        <Alert
          variant="warning"
          className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 py-2"
        >
          <AlertDescription>
            <strong>Important:</strong> These keys are not for proxying
            requests. See{" "}
            <Link
              href="https://docs.helicone.ai/getting-started/integration-methods"
              className="text-primary font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              integration docs
            </Link>
            .
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3">
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
                className="flex items-center gap-1 min-w-[150px] justify-between"
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

        <div className="grid grid-cols-1 gap-2 ">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground col-span-full">
              No providers found matching your search.
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default ProvidersPage;
