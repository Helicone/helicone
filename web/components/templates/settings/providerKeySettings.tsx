import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import { XSmall, Muted } from "@/components/ui/typography";
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
import { useOrg } from "@/components/layout/org/organizationContext";

interface ProviderKeySettingsProps {
  className?: string;
}

export const ProviderKeySettings: React.FC<ProviderKeySettingsProps> = ({
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const org = useOrg();

  const filteredProviders = sortProviders(
    filterProviders(
      filterPubliclyVisibleProviders(providers, org?.currentOrg?.id),
      searchQuery,
    ),
    sortOption,
    recentlyUsedProviderIds,
  );

  return (
    <div className={className}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
            className="h-8 pl-8 text-xs"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex min-w-[120px] items-center justify-between gap-1"
            >
              <XSmall>
                Sort:{" "}
                {sortOption === "relevance"
                  ? "Relevance"
                  : sortOption === "alphabetical"
                    ? "A-Z"
                    : "Recently Used"}
              </XSmall>
              <ChevronDown className="h-3 w-3" />
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

      <div className="space-y-0">
        {filteredProviders.length === 0 ? (
          <div className="border-2 border-dashed border-border bg-muted p-8 text-center">
            <Muted className="font-medium">
              No providers found matching your search.
            </Muted>
          </div>
        ) : (
          filteredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))
        )}
      </div>
    </div>
  );
};
