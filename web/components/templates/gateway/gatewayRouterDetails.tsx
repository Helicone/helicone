import { useOrg } from "@/components/layout/org/organizationContext";
import FoldedHeader from "@/components/shared/FoldedHeader";
import MarkdownEditor from "@/components/shared/markdownEditor";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Muted, Small, XSmall } from "@/components/ui/typography";
import { useFeatureFlag } from "@/services/hooks/admin";
import yaml from "js-yaml";
import { CopyIcon, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import useGatewayRouter from "./useGatewayRouter";
import ThemedTimeFilter from "@/components/shared/themed/themedTimeFilter";
import { TimeFilter } from "@/types/timeFilter";
import { useSearchParams } from "next/navigation";
import {
  getTimeInterval,
  getTimeIntervalAgo,
  TimeInterval,
} from "@/lib/timeCalculations/time";
import { RequestOverTimeChart } from "./requestOverTimeChart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ThemedTable from "@/components/shared/themed/table/themedTable";
import { ColumnDef } from "@tanstack/react-table";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { getInitialColumns } from "./initialColumns";
import { CostOverTimeChart } from "./costOverTimeChart";
import { LatencyOverTimeChart } from "./latencyOverTimeChart";
import RouterUseDialog from "./routerUseDialog";
import useGatewayRouterRequests from "./useGatewayRouterRequests";

// Table columns for gateway router requests
const getGatewayRequestColumns = (): ColumnDef<MappedLLMRequest>[] => {
  return getInitialColumns();
};

const GatewayRouterPage = () => {
  const router = useRouter();
  const { router_hash } = router.query;
  const searchParams = useSearchParams();
  const {
    gatewayRouter,
    isLoading,
    updateGatewayRouter,
    isUpdatingGatewayRouter,
    validateRouterConfig,
  } = useGatewayRouter({ routerHash: router_hash as string });

  const [config, setConfig] = useState<string>("");
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [interval, setInterval] = useState<TimeInterval>(
    (() => {
      const currentTimeFilter = searchParams?.get("t") as TimeInterval;
      if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
        return "custom";
      } else {
        return currentTimeFilter || "24h";
      }
    })(),
  );
  const getTimeFilter = () => {
    const currentTimeFilter = searchParams?.get("t");
    let range: TimeFilter;

    if (currentTimeFilter && currentTimeFilter.split("_")[0] === "custom") {
      const start = currentTimeFilter.split("_")[1]
        ? new Date(currentTimeFilter.split("_")[1])
        : getTimeIntervalAgo("24h");
      const end = new Date(currentTimeFilter.split("_")[2] || new Date());
      range = {
        start,
        end,
      };
    } else {
      range = {
        start: getTimeIntervalAgo((currentTimeFilter as TimeInterval) || "1m"),
        end: new Date(),
      };
    }
    return range;
  };

  const [timeFilter, setTimeFilter] = useState<TimeFilter>(getTimeFilter());
  const timeIncrement = useMemo(
    () => getTimeInterval(timeFilter),
    [timeFilter],
  );

  // Fetch requests for this router
  const {
    requests,
    isLoading: isLoadingRequests,
    count,
  } = useGatewayRouterRequests({
    routerHash: gatewayRouter?.data?.hash ?? "",
    timeFilter,
    page: 1,
    pageSize: 50,
  });

  useEffect(() => {
    if (gatewayRouter) {
      const yamlString = yaml.dump(gatewayRouter.data?.config);
      setConfig(yamlString);
    }
  }, [gatewayRouter]);

  const { setNotification } = useNotification();

  const handleConfigSave = async () => {
    const obj = yaml.load(config);

    const result = await validateRouterConfig(obj);
    if (!result.valid || result.error) {
      setNotification("Invalid router config", "error");
      return;
    }

    updateGatewayRouter({
      params: {
        path: {
          routerHash: router_hash as string,
        },
      },
      body: {
        name: gatewayRouter?.data?.name ?? "",
        config: JSON.stringify(obj),
      },
    });

    setConfigModalOpen(false);
    setNotification("Configuration saved successfully", "success");
  };

  const org = useOrg();
  const { data: hasFeatureFlag } = useFeatureFlag(
    "ai_gateway",
    org?.currentOrg?.id ?? "",
  );
  const [routerUseDialogOpen, setRouterUseDialogOpen] = useState(
    searchParams?.get("new-router") === "true",
  );

  if (!hasFeatureFlag) {
    return <div>You do not have access to the AI Gateway</div>;
  }

  const handleRouterUseDialogOpen = (open: boolean) => {
    setRouterUseDialogOpen(open);
    if (!open) {
      router.replace(`/gateway/${router_hash}`, undefined, { shallow: true });
    }
  };

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <FoldedHeader
        showFold={false}
        leftSection={
          <div className="flex flex-row items-center gap-4">
            <div className="flex flex-row items-center gap-1">
              <Link href="/gateway" className="no-underline">
                <Small className="font-semibold">AI Gateway</Small>
              </Link>
              <Small className="font-semibold">/</Small>
              <Link href={`/gateway/${router_hash}`} className="no-underline">
                <Muted className="text-sm">
                  {gatewayRouter?.data?.name || gatewayRouter?.data?.hash}
                </Muted>
              </Link>
            </div>
            <ThemedTimeFilter
              timeFilterOptions={[]}
              isFetching={isLoading}
              onSelect={(key, value) => {
                if ((key as string) === "custom") {
                  value = value.replace("custom:", "");
                  const start = new Date(value.split("_")[0]);
                  const end = new Date(value.split("_")[1]);
                  setInterval(key as TimeInterval);
                  setTimeFilter({
                    start,
                    end,
                  });
                } else {
                  setInterval(key as TimeInterval);
                  setTimeFilter({
                    start: getTimeIntervalAgo(key as TimeInterval),
                    end: new Date(),
                  });
                }
              }}
              defaultValue={interval ?? "all"}
              currentTimeFilter={timeFilter}
              custom={true}
            />
          </div>
        }
        rightSection={
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">Router Hash</div>
            <div className="text-sm text-muted-foreground">
              {gatewayRouter?.data?.hash}
            </div>
            <Button
              variant="ghost"
              size="sm_sleek"
              className="text-muted-foreground"
              onClick={() => {
                navigator.clipboard.writeText(gatewayRouter?.data?.hash ?? "");
                setNotification("Copied to clipboard", "success");
              }}
            >
              <CopyIcon className="h-3 w-3" />
            </Button>
            <RouterUseDialog
              routerHash={gatewayRouter?.data?.hash ?? ""}
              open={routerUseDialogOpen}
              setOpen={handleRouterUseDialogOpen}
            />
            <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Router Configuration</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <MarkdownEditor
                    monaco
                    text={config}
                    setText={(value) => setConfig(value)}
                    disabled={false}
                    language="yaml"
                    monacoOptions={{
                      lineNumbers: "on",
                      tabSize: 2,
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setConfigModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!config || isUpdatingGatewayRouter}
                      onClick={handleConfigSave}
                    >
                      {isUpdatingGatewayRouter ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save Configuration"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
        <RequestOverTimeChart
          routerHash={gatewayRouter?.data?.hash ?? ""}
          timeFilter={timeFilter}
          timeIncrement={timeIncrement}
        />
        <CostOverTimeChart
          routerHash={gatewayRouter?.data?.hash ?? ""}
          timeFilter={timeFilter}
          timeIncrement={timeIncrement}
        />

        <LatencyOverTimeChart
          routerHash={gatewayRouter?.data?.hash ?? ""}
          timeFilter={timeFilter}
          timeIncrement={timeIncrement}
          totalRequests={count ?? 0}
        />
      </div>

      {/* Requests Table */}
      <XSmall className="flex w-full justify-end text-muted-foreground">
        We only show the last 50 requests of this router in the time range
        selected. For more, please use the requests page and filter by router
        id.
      </XSmall>
      <div className="flex-1 overflow-auto">
        <ThemedTable
          id="gateway-router-requests"
          defaultData={requests}
          defaultColumns={getGatewayRequestColumns()}
          skeletonLoading={isLoadingRequests}
          dataLoading={false}
          activeColumns={getGatewayRequestColumns().map((col) => ({
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
    </main>
  );
};

export default GatewayRouterPage;
