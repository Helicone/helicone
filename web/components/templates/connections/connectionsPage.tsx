import { Input } from "@/components/ui/input";
import { useIntegrations } from "@/services/hooks/useIntegrations";
import Fuse from "fuse.js";
import React, { useMemo, useState } from "react";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import IntegrationSection from "./integrationSection";
import OpenPipeConfig from "./openPipeConfig";
import {
  Integration,
  IntegrationSection as IntegrationSectionType,
} from "./types";
import SegmentConfig from "./segmentConfig";

const INTEGRATION_SECTIONS: IntegrationSectionType[] = [
  { title: "LLM Providers", type: "provider" },
  { title: "Other Providers", type: "other-provider" },
  { title: "Fine-Tuning Integrations", type: "fine-tuning" },
  { title: "Destinations", type: "destination" },
  { title: "Gateway", type: "gateway" },
];

const ConnectionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  const { integrations, isLoadingIntegrations, refetchIntegrations } =
    useIntegrations();

  const allItems: Integration[] = useMemo(
    () => [
      // { title: "OpenAI", type: "provider" },
      // { title: "Anthropic", type: "provider" },
      // { title: "Together AI", type: "provider" },
      // { title: "OpenRouter", type: "provider" },
      // { title: "Fireworks", type: "provider" },
      // { title: "Azure", type: "provider" },
      // { title: "Groq", type: "provider" },
      // { title: "Deepinfra", type: "provider" },
      // { title: "Anyscale", type: "provider" },
      // { title: "Cloudflare", type: "provider" },
      // { title: "LemonFox", type: "provider" },
      // { title: "Perplexity", type: "provider" },
      // { title: "Mistral", type: "provider" },
      {
        title: "OpenPipe",
        type: "fine-tuning",
        enabled:
          integrations?.find(
            (integration) => integration.integration_name === "open_pipe"
          )?.active ?? false,
      },
      // { title: "PostHog", type: "destination", enabled: false },
      {
        title: "Segment",
        type: "destination",
        enabled:
          integrations?.find(
            (integration) => integration.integration_name === "segment"
          )?.active ?? false,
      },
      // { title: "Datadog", type: "destination", enabled: false },
      // { title: "Pillar", type: "gateway", enabled: true },
      // { title: "NotDiamond", type: "gateway", enabled: false },
      // { title: "Diffy", type: "other-provider", enabled: false },
      // { title: "Lytix", type: "destination", enabled: false },
    ],
    [integrations]
  );

  const fuse = useMemo(
    () => new Fuse(allItems, { keys: ["title"], threshold: 0.4 }),
    [allItems]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, allItems, fuse]);

  const handleIntegrationClick = (title: string) => {
    setActiveDrawer(title);
  };

  const handleCloseDrawer = () => {
    setActiveDrawer(null);
    refetchIntegrations();
  };

  return (
    <div className="flex flex-col space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Connections</h1>
        <p className="text-gray-500">
          Explore and connect with various integrations to enhance your Helicone
          experience.
        </p>
      </div>

      <Input
        type="text"
        placeholder="Search integrations..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full max-w-sm"
      />

      {INTEGRATION_SECTIONS.map((section) => (
        <IntegrationSection
          key={section.type}
          title={section.title}
          items={filteredItems.filter((item) => item.type === section.type)}
          onIntegrationClick={handleIntegrationClick}
        />
      ))}

      <ThemedDrawer open={activeDrawer !== null} setOpen={handleCloseDrawer}>
        {activeDrawer === "OpenPipe" && (
          <OpenPipeConfig onClose={handleCloseDrawer} />
        )}
        {activeDrawer === "Segment" && (
          <SegmentConfig onClose={handleCloseDrawer} />
        )}
        {/* Add more configuration components for other integrations here */}
      </ThemedDrawer>
    </div>
  );
};

export default ConnectionsPage;
