import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, TextInput } from "@tremor/react";
import dateFormat from "dateformat";
import { useEffect, useState } from "react";
import { Copy, Clock } from "lucide-react";

import { getJawnClient } from "../../../../lib/clients/jawn";
import useNotification from "../../../shared/notification/useNotification";
import { handleLogCostCalculation } from "../../../../utils/LogCostCalculation";
import { Button } from "@/components/ui/button";
import { H2, H3, P, Small, Muted } from "@/components/ui/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TopOrgsProps {}

function formatBigNumberWithCommas(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const TopOrgs = (props: TopOrgsProps) => {
  const {} = props;

  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();

  const [timeRange, setTimeRange] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);

  useEffect(() => {
    setTimeRange({
      // Default to a week
      startDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
  }, []);

  const [tier, setTier] = useState<
    "all" | "free" | "pro" | "enterprise" | "growth"
  >("all");

  const [orgName, setOrgName] = useState("");
  const [emailContains, setEmailContains] = useState("");

  const [searchQuery, setSearchQuery] = useState<{
    orgToSearch: string;
    emailContains: string;
  }>({
    orgToSearch: "",
    emailContains: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["top_orgs", timeRange, tier, searchQuery],
    queryFn: async (query) => {
      const timeRange = query.queryKey[1] as { startDate: Date; endDate: Date };
      const tier = query.queryKey[2] as
        | "all"
        | "free"
        | "pro"
        | "enterprise"
        | "growth";
      const searchQuery = query.queryKey[3] as {
        orgToSearch: string;
        emailContains: string;
      };
      if (!timeRange) return;
      const jawn = getJawnClient();

      return jawn.POST("/v1/admin/orgs/top", {
        body: {
          startDate: dateFormat(timeRange.startDate, "yyyy-mm-dd HH:MM:ss"),
          endDate: dateFormat(timeRange.endDate, "yyyy-mm-dd HH:MM:ss"),
          tier: tier,

          orgsNameContains: searchQuery.orgToSearch
            ? [searchQuery.orgToSearch]
            : undefined,
          emailContains: searchQuery.emailContains
            ? [searchQuery.emailContains]
            : undefined,
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  const tiers = ["all", "free", "pro", "enterprise", "growth"];

  const timeRangeOptions = [
    { label: "Last 30 days", days: 30 },
    { label: "Last 7 days", days: 7 },
    { label: "Last 24 hours", hours: 24 },
    { label: "Last hour", hours: 1 },
  ];

  const handleTimeRangeChange = (days?: number, hours?: number) => {
    const milliseconds =
      (days ? days * 24 * 60 * 60 * 1000 : 0) +
      (hours ? hours * 60 * 60 * 1000 : 0);

    setTimeRange({
      startDate: new Date(new Date().getTime() - milliseconds),
      endDate: new Date(),
    });
  };

  const totalMRR =
    data?.data
      ?.map((org) => handleLogCostCalculation(org.ct))
      .reduce((acc, curr) => acc + curr, 0) || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <H2>Top Organizations</H2>
        <Muted>View and analyze top organizations by usage</Muted>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Small className="font-medium">Search Organizations</Small>
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-2">
                <TextInput
                  placeholder="Organization Name"
                  value={orgName}
                  onValueChange={setOrgName}
                />
              </div>
              <div className="col-span-2">
                <TextInput
                  placeholder="Email Search"
                  value={emailContains}
                  onValueChange={setEmailContains}
                />
              </div>
              <div className="col-span-1">
                <Button
                  disabled={isLoading}
                  onClick={() => {
                    setSearchQuery({
                      emailContains: emailContains,
                      orgToSearch: orgName,
                    });
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Small className="font-medium">Time Range</Small>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Small className="block mb-1 text-muted-foreground">
                  Start Date
                </Small>
                <Input
                  type="datetime-local"
                  value={timeRange?.startDate.toISOString().slice(0, 16)}
                  onChange={(e) => {
                    setTimeRange({
                      ...timeRange!,
                      startDate: new Date(e.target.value),
                    });
                  }}
                  className="bg-card"
                />
              </div>
              <div>
                <Small className="block mb-1 text-muted-foreground">
                  End Date
                </Small>
                <Input
                  type="datetime-local"
                  value={timeRange?.endDate.toISOString().slice(0, 16)}
                  onChange={(e) =>
                    setTimeRange({
                      ...timeRange!,
                      endDate: new Date(e.target.value),
                    })
                  }
                  className="bg-card"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {timeRangeOptions.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleTimeRangeChange(option.days, option.hours)
                  }
                >
                  <Clock className="mr-1 h-3 w-3" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Small className="font-medium">Tier Filter</Small>
            <div className="flex flex-wrap gap-2">
              {tiers.map((t) => (
                <Button
                  key={t}
                  variant={tier === t ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setTier(t as any);
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-muted/30 rounded-md p-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <Small className="text-muted-foreground">Time Range</Small>
              <P className="font-medium">
                {timeRange?.startDate.toLocaleString()} -{" "}
                {timeRange?.endDate.toLocaleString()}
              </P>
            </div>
            <div>
              <Small className="text-muted-foreground">
                Estimated Total MRR
              </Small>
              <P className="font-medium">${totalMRR.toFixed(2)}</P>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <H3>Organization Results</H3>

          <div className="grid grid-cols-9 px-4 py-2 bg-muted/30 rounded-md text-sm font-medium">
            <div className="col-span-2">Org ID</div>
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Email</div>
            <div className="col-span-1">Tier</div>
            <div className="col-span-1">Count</div>
            <div className="col-span-1">Est. Spend</div>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-pulse h-6 w-32 bg-muted rounded"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {data?.data?.map((org, i) => (
                <div
                  key={org.organization_id}
                  className="border border-border rounded-md overflow-hidden"
                >
                  <div className="grid grid-cols-9 p-4 items-center gap-2">
                    <div className="col-span-2 truncate">
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-muted px-1 py-0.5 rounded truncate font-mono">
                          {org.organization_id}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1"
                          onClick={() => {
                            navigator.clipboard.writeText(org.organization_id);
                            setNotification("Copied to clipboard", "success");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copy ID</span>
                        </Button>
                      </div>
                    </div>
                    <div className="col-span-2 font-medium truncate">
                      {org.name}
                    </div>
                    <div className="col-span-2 text-muted-foreground truncate">
                      {org.owner_email}
                    </div>
                    <div className="col-span-1">
                      <Badge variant="outline">{org.tier}</Badge>
                    </div>
                    <div className="col-span-1 font-medium">
                      {formatBigNumberWithCommas(org.ct)}
                    </div>
                    <div className="col-span-1">
                      ${handleLogCostCalculation(org.ct).toFixed(2)}
                    </div>
                  </div>

                  <div className="border-t border-border p-4 bg-card/50">
                    <Small className="font-medium mb-2 block">
                      Usage Over Time
                    </Small>
                    <div className="h-40">
                      <BarChart
                        data={org.overTime.map((ot) => ({
                          dt: ot.dt,
                          count: +ot.count,
                        }))}
                        categories={["count"]}
                        index={"dt"}
                        showYAxis={true}
                        className="h-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data?.data?.length === 0 && (
            <div className="py-8 text-center border border-border rounded-md">
              <Muted>No organizations found matching your criteria</Muted>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopOrgs;
