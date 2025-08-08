import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";
import { ReactElement, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
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
import {
  SettingsContainer,
  SettingsSectionHeader,
  SettingsSectionContent,
} from "@/components/ui/settings-container";
import "@/styles/settings.css";

const ProvidersSettings: NextPageWithLayout<void> = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");

  // Filter and sort the providers based on user selections
  const filteredProviders = sortProviders(
    filterProviders(providers, searchQuery),
    sortOption,
    recentlyUsedProviderIds,
  );

  return (
    <SettingsContainer>
      <SettingsSectionHeader
        title="Providers"
        description="Configure your API keys for different LLM providers"
      />

      <SettingsSectionContent>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search providers..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="settings-search-small"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="settings-btn-small flex min-w-[120px] items-center justify-between gap-1"
              >
                <span className="settings-small">
                  Sort:{" "}
                  {sortOption === "relevance"
                    ? "Relevance"
                    : sortOption === "alphabetical"
                      ? "A-Z"
                      : "Recently Used"}
                </span>
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
            <div className="settings-empty-state">
              <p className="settings-empty-state-text">
                No providers found matching your search.
              </p>
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))
          )}
        </div>
      </SettingsSectionContent>
    </SettingsContainer>
  );
};

ProvidersSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default ProvidersSettings;
