import { Small, XSmall } from "@/components/ui/typography";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SortOption } from "@/types/provider";
import { providers, recentlyUsedProviderIds } from "@/data/providers";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { filterProviders, sortProviders } from "@/utils/providerUtils";

import useGatewayRouterRequests from "./useGatewayRouterRequests";
import { RequestOverTimeChart } from "./requestOverTimeChart";
import { CostOverTimeChart } from "./costOverTimeChart";
import { LatencyOverTimeChart } from "./latencyOverTimeChart";
import { getInitialColumns } from "./initialColumns";
import ThemedTable from "@/components/shared/themed/table/themedTable";
import { TimeFilter } from "@/types/timeFilter";
import { getTimeIntervalAgo } from "@/lib/timeCalculations/time";
import { getRouterCode } from "./routerUseDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

const baseUrl = `${process.env.NEXT_PUBLIC_CLOUD_GATEWAY_BASE_URL}/ai`;

const DefaultAIGateway = ({
  setTabValue,
}: {
  setTabValue: () => void;
}) => {
  // Provider management state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("relevance");

  // Filter and sort the providers based on user selections
  const filteredProviders = sortProviders(
    filterProviders(providers, searchQuery),
    sortOption,
    recentlyUsedProviderIds,
  );

  return (
    <div className="flex flex-col h-full">
      {/* Beta Banner */}
      <div className="w-full border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 flex-shrink-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex flex-col gap-1">
            <Small className="font-medium text-blue-900 dark:text-blue-100">
              🚀 AI Gateway is in Beta
            </Small>
            <Small className="text-blue-700 dark:text-blue-200">
              This is a new feature that we're actively improving. We'd love to hear your feedback!
            </Small>
          </div>
          <a
            href="https://cal.com/team/helicone/gateway-chat"
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            target="_blank"
            rel="noopener noreferrer"
          >
            Schedule a Call
          </a>
        </div>
      </div>

      {/* AI Gateway Getting Started Section */}
      <div className="w-full border border-border bg-background flex-shrink-0">
        <div className="p-4">
          <Tabs defaultValue="curl" className="w-full">
            <div className="flex items-center justify-between mb-2">
              <TabsList className="w-auto">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Getting Started with AI Gateway</DialogTitle>
                    <DialogDescription>
                      Learn how to use the AI Gateway and access advanced features.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Send your first request to the AI Gateway using one of the code examples above.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm">
                        For more information on how to use the AI Gateway, please refer to the{" "}
                        <a
                          href="https://docs.helicone.ai/ai-gateway"
                          className="font-medium text-primary underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          documentation
                        </a>
                      </p>
                      <p className="text-sm">
                        To create custom routers with load balancing, caching, rate limiting and retries strategy,{" "}
                        <button
                          className="font-medium text-primary underline"
                          onClick={() => setTabValue()}
                        >
                          go to My Routers
                        </button>
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <TabsContent value="curl" className="mt-2">
              <DiffHighlight
                code={getRouterCode(baseUrl, "curl")}
                language="bash"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
                maxHeight={false}
                textSize="sm"
                marginTop={false}
              />
            </TabsContent>

            <TabsContent value="javascript" className="mt-2">
              <DiffHighlight
                code={getRouterCode(baseUrl, "javascript")}
                language="typescript"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
                maxHeight={false}
                textSize="sm"
                marginTop={false}
              />
            </TabsContent>

            <TabsContent value="python" className="mt-2">
              <DiffHighlight
                code={getRouterCode(baseUrl, "python")}
                language="python"
                newLines={[]}
                oldLines={[]}
                minHeight={false}
                maxHeight={false}
                textSize="sm"
                marginTop={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Provider Management Section */}
      <div className="border-t border-border bg-background flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <Small className="font-bold text-gray-500 dark:text-slate-300">
            Provider Configuration
          </Small>
          <Small className="text-muted-foreground">
            Configure your API keys for different LLM providers
          </Small>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row p-4 border-b border-border flex-shrink-0">
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

        <ScrollArea className="flex-1 p-4">
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
        </ScrollArea>
      </div>
    </div>
  );

};

export default DefaultAIGateway;
