import React, { useState, useEffect } from "react";
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
import { useProviderConfig } from "@/hooks/useProviderConfig";
import { providers, recentlyUsedProviderIds } from "@/data/providers";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { filterProviders, sortProviders } from "@/utils/providerUtils";

export const ProvidersPage: React.FC = () => {
  // Local UI state
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");

  // Use our enhanced hook with all provider configuration logic
  const {
    // Data and loading states
    providerConfigs,
    isLoadingConfigs,
    apiKeys,
    keyNames,
    savingProvider,
    savedProvider,

    // Helper functions
    getProviderKeysForProvider,
    getConfigurationIdForProvider,
    viewDecryptedProviderKey,
    refetchProviderConfigs,

    // Enhanced functions with built-in error handling and notifications
    saveConfig,
    saveKey,
    deleteKey,
    updateApiKey,
    updateKeyName,
  } = useProviderConfig();

  // Refetch data when component mounts
  useEffect(() => {
    refetchProviderConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (providerId: string) => {
    setExpandedProvider(expandedProvider === providerId ? null : providerId);
  };

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

        <div className="border rounded-md divide-y overflow-hidden bg-white dark:bg-gray-950">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No providers found matching your search.
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                expanded={expandedProvider === provider.id}
                onToggleExpand={() => toggleExpand(provider.id)}
                isLoadingConfig={isLoadingConfigs}
                configId={getConfigurationIdForProvider(provider.id)}
                providerKeys={getProviderKeysForProvider(provider.id)}
                keyName={keyNames[provider.id] || ""}
                apiKey={apiKeys[provider.id] || ""}
                onKeyNameChange={(value) => updateKeyName(provider.id, value)}
                onApiKeyChange={(value) => updateApiKey(provider.id, value)}
                onSaveKey={() => saveKey(provider.id, providers)}
                onDeleteKey={(keyId) => deleteKey(keyId)}
                onSaveConfig={() => saveConfig(provider.id, providers)}
                isSavingKey={savingProvider === provider.id}
                isSavedKey={savedProvider === provider.id}
                viewDecryptedProviderKey={viewDecryptedProviderKey}
              />
            ))
          )}
        </div>
      </div>
    </AuthLayout>
  );
};

export default ProvidersPage;
