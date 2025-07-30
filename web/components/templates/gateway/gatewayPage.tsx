import FoldedHeader from "@/components/shared/FoldedHeader";

import { Small } from "@/components/ui/typography";
import { TriangleAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useProvider } from "@/hooks/useProvider";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MyRouters from "./myRouters";
import DefaultAIGateway from "./defaultAIGateway";
import ThemedTimeFilter from "@/components/shared/themed/themedTimeFilter";
import { useMemo, useState } from "react";
import { TimeFilter } from "@/types/timeFilter";
import { useSearchParams } from "next/navigation";
import {
  getTimeInterval,
  getTimeIntervalAgo,
  TimeInterval,
} from "@/lib/timeCalculations/time";

const GatewayPage = () => {
  const org = useOrg();
  const { data: hasFeatureFlag } = useFeatureFlag(
    "ai_gateway",
    org?.currentOrg?.id ?? "",
  );

  const { providerKeys } = useProvider();

  const searchParams = useSearchParams();
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

  const [tabValue, setTabValue] = useState<string>("/ai");

  if (!hasFeatureFlag) {
    return <div>You do not have access to the AI Gateway</div>;
  }

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <FoldedHeader
          showFold={false}
          leftSection={
            <div className="flex items-center gap-1">
              <Small className="font-bold text-gray-500 dark:text-slate-300">
                AI Gateway
              </Small>
              {tabValue === "/ai" && (
                <ThemedTimeFilter
                  timeFilterOptions={[]}
                  isFetching={
                    false
                  } /* TODO: pull up isFetching state from child component */
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
              )}
            </div>
          }
          rightSection={
            <>
              {providerKeys.length === 0 && (
                <Badge
                  variant="helicone"
                  className="gap-2 bg-yellow-200/70 text-yellow-500 hover:bg-yellow-200/70 dark:bg-yellow-900/70 dark:text-yellow-500 dark:hover:bg-yellow-900/70"
                >
                  <TriangleAlertIcon className="h-3 w-3" />
                  <span>
                    You have no provider keys set. Set them in the{" "}
                    <Link href="/providers" className="underline">
                      providers
                    </Link>{" "}
                    page.
                  </span>
                </Badge>
              )}
              <TabsList size="sm">
                <TabsTrigger value="/ai">Default AI Gateway</TabsTrigger>
                <TabsTrigger
                  className="flex items-center gap-2 bg-sidebar-background dark:bg-sidebar-foreground"
                  value="/router"
                >
                  My Routers
                </TabsTrigger>
              </TabsList>
            </>
          }
        />

        <TabsContent value="/ai">
          <DefaultAIGateway
            timeFilter={timeFilter}
            timeIncrement={timeIncrement}
            setTabValue={() => {
              setTabValue("/router");
            }}
          />
        </TabsContent>
        <TabsContent value="/router">
          <MyRouters />
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default GatewayPage;
