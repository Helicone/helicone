import { Small, XSmall, H4 } from "@/components/ui/typography";

import useGatewayRouterRequests from "./useGatewayRouterRequests";
import { RequestOverTimeChart } from "./requestOverTimeChart";
import { CostOverTimeChart } from "./costOverTimeChart";
import { LatencyOverTimeChart } from "./latencyOverTimeChart";
import { getInitialColumns } from "./initialColumns";
import ThemedTable from "@/components/shared/themed/table/themedTable";
import { TimeFilter } from "@/types/timeFilter";
import { TimeIncrement } from "@/lib/timeCalculations/fetchTimeData";
import { getRouterCode } from "./routerUseDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const baseUrl = `${process.env.NEXT_PUBLIC_CLOUD_GATEWAY_BASE_URL}/ai`;

const DefaultAIGateway = ({
  timeFilter,
  timeIncrement,
  setTabValue,
}: {
  timeFilter: TimeFilter;
  timeIncrement: TimeIncrement;
  setTabValue: () => void;
}) => {
  // Fetch requests for this router
  const {
    requests,
    isLoading: isLoadingRequests,
    count,
  } = useGatewayRouterRequests({
    routerHash: undefined,
    timeFilter,
    page: 1,
    pageSize: 50,
  });

  if (!requests.length) {
    return (
      <div className="flex h-[calc(100vh-57px)] w-full items-center justify-center">
        <Card className="m-2 w-full max-w-3xl">
          <CardHeader>
            <H4>Get Started with AI Gateway</H4>
            <Small className="text-muted-foreground">
              Send your first request to the AI Gateway using one of the
              examples below
            </Small>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>

              <TabsContent value="curl" className="mt-4">
                <DiffHighlight
                  code={getRouterCode(baseUrl, "curl")}
                  language="bash"
                  newLines={[]}
                  oldLines={[]}
                  minHeight={false}
                  maxHeight={false}
                />
              </TabsContent>

              <TabsContent value="javascript" className="mt-4">
                <DiffHighlight
                  code={getRouterCode(baseUrl, "javascript")}
                  language="typescript"
                  newLines={[]}
                  oldLines={[]}
                  minHeight={false}
                  maxHeight={false}
                />
              </TabsContent>

              <TabsContent value="python" className="mt-4">
                <DiffHighlight
                  code={getRouterCode(baseUrl, "python")}
                  language="python"
                  newLines={[]}
                  oldLines={[]}
                  minHeight={false}
                  maxHeight={false}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex w-full flex-col items-end justify-end">
            <Small className="text-muted-foreground">
              For more information on how to use the AI Gateway, please refer to
              the{" "}
              <a
                href="https://docs.helicone.ai/ai-gateway"
                className="cursor-pointer font-medium text-primary underline"
              >
                documentation
              </a>
            </Small>
            <Small className="text-muted-foreground">
              To create custom routers with load balancing, caching, rate
              limiting and retries strategy, click on{" "}
              <a
                href="#"
                className="cursor-pointer font-medium text-primary underline"
                onClick={(e) => {
                  e.preventDefault();
                  setTabValue();
                }}
              >
                My Routers
              </a>
            </Small>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
        <RequestOverTimeChart
          routerHash={undefined}
          timeFilter={timeFilter}
          timeIncrement={timeIncrement}
        />
        <CostOverTimeChart
          routerHash={undefined}
          timeFilter={timeFilter}
          timeIncrement={timeIncrement}
        />

        <LatencyOverTimeChart
          routerHash={undefined}
          timeFilter={timeFilter}
          timeIncrement={timeIncrement}
          totalRequests={count ?? 0}
        />
      </div>

      {/* Requests Table */}
      <>
        <XSmall className="flex w-full justify-end text-muted-foreground">
          We only show the last 50 requests of this router in the time range
          selected. For more, please use the requests page and filter by router
          id.
        </XSmall>
        <div className="flex-1 overflow-auto">
          <ThemedTable
            id="gateway-router-requests"
            defaultData={requests}
            defaultColumns={getInitialColumns()}
            skeletonLoading={isLoadingRequests}
            dataLoading={false}
            activeColumns={getInitialColumns().map((col) => ({
              id: (col as any).accessorKey as string,
              name: (col as any).header as string,
              shown: true,
              column: undefined,
            }))}
            setActiveColumns={() => {}}
            checkboxMode="never"
            onRowSelect={() => {}}
            onSelectAll={() => {}}
            selectedIds={[]}
          />
        </div>
      </>
    </div>
  );
};

export default DefaultAIGateway;
