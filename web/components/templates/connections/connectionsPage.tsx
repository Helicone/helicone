import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Fuse from "fuse.js";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { LOGOS } from "./connectionSVG";

type IntegrationType =
  | "provider"
  | "other-provider"
  | "fine-tuning"
  | "destination"
  | "gateway";

interface Integration {
  title: string;
  type: IntegrationType;
  enabled?: boolean;
}

interface IntegrationSection {
  title: string;
  type: IntegrationType;
}

const INTEGRATION_SECTIONS: IntegrationSection[] = [
  { title: "LLM Providers", type: "provider" },
  { title: "Other Providers", type: "other-provider" },
  { title: "Fine-Tuning Integrations", type: "fine-tuning" },
  { title: "Destinations", type: "destination" },
  { title: "Gateway", type: "gateway" },
];

const ConnectionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const allItems: Integration[] = useMemo(
    () => [
      { title: "OpenAI", type: "provider" },
      { title: "Anthropic", type: "provider" },
      { title: "Together AI", type: "provider" },
      { title: "OpenRouter", type: "provider" },
      { title: "Fireworks", type: "provider" },
      { title: "Azure", type: "provider" },
      { title: "Groq", type: "provider" },
      { title: "Deepinfra", type: "provider" },
      { title: "Anyscale", type: "provider" },
      { title: "Cloudflare", type: "provider" },
      { title: "LemonFox", type: "provider" },
      { title: "Perplexity", type: "provider" },
      { title: "Mistral", type: "provider" },
      { title: "OpenPipe", type: "fine-tuning", enabled: true },
      { title: "PostHog", type: "destination", enabled: false },
      { title: "Datadog", type: "destination", enabled: true },
      { title: "Pillar", type: "gateway", enabled: true },
      { title: "NotDiamond", type: "gateway", enabled: false },

      { title: "Diffy", type: "other-provider", enabled: false },
      { title: "Lytix", type: "destination", enabled: false },
    ],
    []
  );

  const fuse = useMemo(
    () => new Fuse(allItems, { keys: ["title"], threshold: 0.4 }),
    [allItems]
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery) return allItems;
    return fuse.search(searchQuery).map((result) => result.item);
  }, [searchQuery, allItems, fuse]);

  return (
    <div className="flex flex-col space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Integrations</h1>
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
        />
      ))}
    </div>
  );
};

interface IntegrationSectionProps {
  title: string;
  items: Integration[];
}

const IntegrationSection: React.FC<IntegrationSectionProps> = ({
  title,
  items,
}) => {
  if (items.length === 0) return null;

  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <Carousel>
        <CarouselContent className="gap-4">
          {items.map((item, index) => (
            <CarouselItem key={index} className="basis-[30%]">
              <IntegrationCard
                title={item.title}
                Logo={LOGOS[item.title as keyof typeof LOGOS]}
                description={`Integrate with ${item.title}'s services.`}
                href={`/integrations/${item.title
                  .toLowerCase()
                  .replace(" ", "-")}`}
                enabled={item.enabled}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {items.length > 3 && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>
    </>
  );
};

interface IntegrationCardProps {
  title: string;
  description: string;
  href: string;
  enabled?: boolean;
  Logo?: React.FC<{ className: string }>;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  title,
  description,
  enabled,
  href,
  Logo,
}) => {
  return (
    <Card className="flex flex-col h-[200px]">
      <CardHeader className="flex-grow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {Logo && <Logo className="w-[2rem] h-[2rem] mr-2" />}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          {enabled !== undefined && (
            <Switch
              id={`${title.toLowerCase()}-switch`}
              disabled={true}
              checked={enabled}
              className="data-[state=checked]:bg-green-500"
            />
          )}
        </div>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Link
          href={href}
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
        >
          Learn more
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ConnectionsPage;
