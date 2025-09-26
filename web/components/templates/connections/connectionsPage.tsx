import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/services/hooks/useIntegrations";
import { Search, ChevronDown } from "lucide-react";
import { XSmall, Muted } from "@/components/ui/typography";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Fuse from "fuse.js";
import React, { useMemo, useState } from "react";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import IntegrationRow from "./integrationRow";
import OpenPipeConfig from "./openPipeConfig";
import { Integration } from "./types";
import SegmentConfig from "./segmentConfig";
import StripeConfig from "./stripeConfig";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useOrg } from "@/components/layout/org/organizationContext";

type SortOption = "relevance" | "alphabetical" | "type" | "status";

const ConnectionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  const org = useOrg();
  const { integrations, isLoadingIntegrations, refetchIntegrations } =
    useIntegrations();

  const { data: hasStripeFeatureFlag } = useFeatureFlag(
    "stripe",
    org?.currentOrg?.id ?? "",
  );

  const allItems: Integration[] = useMemo(() => {
    const items: Integration[] = [];

    // Only include Stripe if the feature flag is enabled
    if (hasStripeFeatureFlag?.data) {
      items.push({
        title: "Stripe",
        type: "destination",
        configured: !!integrations?.find(
          (integration) => integration.integration_name === "stripe",
        ),
        enabled:
          integrations?.find(
            (integration) => integration.integration_name === "stripe",
          )?.active ?? false,
      });
    }

    items.push(
      {
        title: "Segment",
        type: "destination",
        configured: !!integrations?.find(
          (integration) => integration.integration_name === "segment",
        ),
        enabled:
          integrations?.find(
            (integration) => integration.integration_name === "segment",
          )?.active ?? false,
      },
      {
        title: "OpenPipe",
        type: "fine-tuning",
        configured: !!integrations?.find(
          (integration) => integration.integration_name === "open_pipe",
        ),
        enabled:
          integrations?.find(
            (integration) => integration.integration_name === "open_pipe",
          )?.active ?? false,
      },
    );

    return items;
  }, [integrations, hasStripeFeatureFlag?.data]);

  const fuse = useMemo(
    () => new Fuse(allItems, { keys: ["title"], threshold: 0.4 }),
    [allItems],
  );

  const filteredItems = useMemo(() => {
    let items = searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : allItems;

    // Sort items
    switch (sortOption) {
      case "relevance":
        // Use original array order - no sorting needed
        break;
      case "alphabetical":
        items = [...items].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "type":
        items = [...items].sort((a, b) => a.type.localeCompare(b.type));
        break;
      case "status":
        items = [...items].sort((a, b) => {
          const aStatus = a.enabled ? 1 : 0;
          const bStatus = b.enabled ? 1 : 0;
          return bStatus - aStatus; // Enabled first
        });
        break;
    }

    return items;
  }, [searchQuery, sortOption, allItems, fuse]);

  const handleIntegrationClick = (title: string) => {
    setActiveDrawer(title);
  };

  const handleCloseDrawer = () => {
    setActiveDrawer(null);
    refetchIntegrations();
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case "relevance":
        return "Relevance";
      case "alphabetical":
        return "Alphabetical";
      case "type":
        return "Type";
      case "status":
        return "Status";
    }
  };

  return (
    <div className="max-w-4xl space-y-6 pl-6 pt-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Connections</h1>
        <p className="text-sm text-muted-foreground">
          Connect and configure integrations to enhance your Helicone experience
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
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
              <XSmall>Sort: {getSortLabel()}</XSmall>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortOption("relevance")}>
              Relevance
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("alphabetical")}>
              Alphabetical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("type")}>
              Type
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOption("status")}>
              Status
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-0">
        {filteredItems.length === 0 ? (
          <div className="border-2 border-dashed border-border bg-muted p-8 text-center">
            <Muted className="font-medium">
              No integrations found matching your search.
            </Muted>
          </div>
        ) : (
          filteredItems.map((integration) => (
            <IntegrationRow
              key={integration.title}
              integration={integration}
              onIntegrationClick={handleIntegrationClick}
            />
          ))
        )}
      </div>

      <ThemedDrawer open={activeDrawer !== null} setOpen={handleCloseDrawer}>
        {activeDrawer === "OpenPipe" && (
          <OpenPipeConfig onClose={handleCloseDrawer} />
        )}
        {activeDrawer === "Segment" && (
          <SegmentConfig onClose={handleCloseDrawer} />
        )}
        {activeDrawer === "Stripe" && (
          <StripeConfig onClose={handleCloseDrawer} />
        )}
        {/* Add more configuration components for other integrations here */}
      </ThemedDrawer>
    </div>
  );
};

export default ConnectionsPage;
