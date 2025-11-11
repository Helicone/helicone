import { useQuery } from "@tanstack/react-query";
import {
  Card,
  LineChart,
} from "@tremor/react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { useOrg } from "../../layout/org/organizationContext";
import { H1, H2, H3, P, Small, Muted } from "@/components/ui/typography";
import { formatLargeNumber } from "../../shared/utils/numberFormat";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface OrgTimeData {
  time: string;
  request_count: number;
}

interface Organization {
  organization_id: string;
  organization_name: string;
  data: OrgTimeData[];
}

interface TopOrgsResponse {
  organizations: Organization[];
}

interface AdminTopOrgsProps {}

const AdminTopOrgs = (props: AdminTopOrgsProps) => {
  const {} = props;
  const org = useOrg();

  const timeRanges = [
    "10 minutes",
    "30 minutes",
    "1 hour",
    "3 hours",
    "12 hours",
    "1 day",
    "3 days",
    "7 days",
    "14 days",
    "30 days",
  ] as const;

  const [timeRange, setTimeRange] = useLocalStorage<
    (typeof timeRanges)[number]
  >("admin-top-orgs-time-range", "1 day");

  const [limit, setLimit] = useLocalStorage<number>("admin-top-orgs-limit", 5);

  const limitOptions = [3, 5, 10, 15, 20] as const;

  // Define groupBy options
  const groupByOptions = {
    "10 minutes": "minute",
    "30 minutes": "minute",
    "1 hour": "minute",
    "3 hours": "10 minute",
    "12 hours": "10 minute",
    "1 day": "10 minute",
    "3 days": "hour",
    "7 days": "hour",
    "14 days": "6 hour",
    "30 days": "day",
  } as const;

  // Get the appropriate groupBy for the selected timeRange
  const getGroupBy = (selectedTimeRange: string) => {
    return (
      groupByOptions[selectedTimeRange as keyof typeof groupByOptions] || "hour"
    );
  };

  // State to track selected organizations
  const [selectedOrgs, setSelectedOrgs] = useLocalStorage<string[]>(
    "admin-top-orgs-selected-orgs",
    [],
  );

  const topOrgsData = useQuery<TopOrgsResponse>({
    queryKey: ["topOrgsOverTime", org?.currentOrg?.id, timeRange, limit],
    queryFn: async (query) => {
      const jawn = getJawnClient(query.queryKey[1] as string);
      const timeRange = query.queryKey[2];
      const limit = query.queryKey[3];
      const groupBy = getGroupBy(timeRange as string);

      // Using a custom path since it's not yet in the types
      const { data, error } = await jawn.POST(
        `/v1/admin/top-orgs-over-time` as any,
        {
          body: {
            timeRange,
            limit,
            groupBy,
          },
        },
      );

      if (error) {
        throw new Error(String(error));
      }

      return data;
    },
  });

  // Update selected orgs when data changes
  useEffect(() => {
    if (
      topOrgsData.data?.organizations &&
      topOrgsData.data.organizations.length > 0
    ) {
      // If no orgs are selected yet or the orgs have changed, select all by default
      if (
        selectedOrgs.length === 0 ||
        !topOrgsData.data.organizations.some((org) =>
          selectedOrgs.includes(org.organization_id),
        )
      ) {
        setSelectedOrgs(
          topOrgsData.data.organizations.map((org) => org.organization_id),
        );
      }
    }
  }, [topOrgsData.data?.organizations]);

  // Toggle organization selection
  const toggleOrgSelection = (orgId: string) => {
    if (selectedOrgs.includes(orgId)) {
      setSelectedOrgs(selectedOrgs.filter((id) => id !== orgId));
    } else {
      setSelectedOrgs([...selectedOrgs, orgId]);
    }
  };

  // Select/deselect all organizations
  const toggleAllOrgs = (select: boolean) => {
    if (select && topOrgsData.data?.organizations) {
      setSelectedOrgs(
        topOrgsData.data.organizations.map((org) => org.organization_id),
      );
    } else {
      setSelectedOrgs([]);
    }
  };

  // Process data for LineChart - transform the series to be compatible with Tremor LineChart
  const chartData = () => {
    if (
      !topOrgsData.data?.organizations ||
      topOrgsData.data.organizations.length === 0
    ) {
      return [];
    }

    // Create a map of all timestamps
    const allTimestamps = new Set<string>();
    topOrgsData.data.organizations.forEach((org: Organization) => {
      org.data.forEach((point: OrgTimeData) => {
        allTimestamps.add(point.time);
      });
    });

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort();

    // Format time based on the groupBy and convert UTC to local time
    const formatTimestamp = (timestamp: string) => {
      // Parse the UTC timestamp from Clickhouse
      const utcDate = new Date(timestamp + "Z"); // Append 'Z' to ensure it's parsed as UTC
      const groupByValue = getGroupBy(timeRange);

      if (groupByValue === "minute") {
        return utcDate.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });
      } else if (groupByValue === "10 minute") {
        return utcDate.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        });
      } else if (groupByValue === "hour") {
        return utcDate.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          timeZoneName: "short",
        });
      } else if (groupByValue === "6 hour") {
        return utcDate.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          timeZoneName: "short",
        });
      } else {
        return utcDate.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          timeZoneName: "short",
        });
      }
    };

    // Create data points for each timestamp
    return sortedTimestamps
      .map((timestamp) => {
        const utcDate = new Date(timestamp + "Z"); // Parse as UTC
        const dataPoint: Record<string, any> = {
          time: formatTimestamp(timestamp),
          timestamp: utcDate.getTime(), // Add this for proper sorting
        };

        // Add each organization's value at this timestamp (only for selected orgs)
        topOrgsData.data.organizations.forEach((org: Organization) => {
          if (selectedOrgs.includes(org.organization_id)) {
            const point = org.data.find((p) => p.time === timestamp);
            dataPoint[org.organization_name] = point ? point.request_count : 0;
          }
        });

        return dataPoint;
      })
      .sort((a, b) => a.timestamp - b.timestamp); // Ensure proper chronological order
  };

  // Generate categories array for the LineChart (only for selected orgs)
  const chartCategories =
    topOrgsData.data?.organizations
      .filter((org) => selectedOrgs.includes(org.organization_id))
      .map((org) => org.organization_name) || [];

  // Generate a different color for each organization
  const chartColors = [
    "blue",
    "red",
    "green",
    "orange",
    "purple",
    "indigo",
    "pink",
    "yellow",
    "cyan",
    "teal",
    "lime",
    "amber",
    "emerald",
    "fuchsia",
  ];

  return (
    <div className="flex flex-col gap-8 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <H1>Top Organizations Over Time</H1>
        <Muted>View request counts for the top organizations over time</Muted>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <div className="flex flex-col gap-2 flex-1">
          <Label className="flex items-center justify-between">
            <span className="font-semibold">Time Range</span>
            <Small className="text-muted-foreground font-normal">
              Grouped by: {getGroupBy(timeRange)}
            </Small>
          </Label>
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem value={range} key={range}>
                  {range}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 flex-1 md:max-w-xs">
          <Label className="font-semibold">Number of Organizations</Label>
          <Select
            value={limit.toString()}
            onValueChange={(value) => setLimit(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((num) => (
                <SelectItem value={num.toString()} key={num}>
                  {num}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <H2>Request Counts Over Time</H2>
            <div className="flex gap-2">
              <Button
                onClick={() => toggleAllOrgs(true)}
                variant="default"
                size="sm"
              >
                Select All
              </Button>
              <Button
                onClick={() => toggleAllOrgs(false)}
                variant="outline"
                size="sm"
              >
                Deselect All
              </Button>
            </div>
          </div>

          {topOrgsData.isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p>Loading data...</p>
            </div>
          ) : topOrgsData.error ? (
            <div className="flex h-64 items-center justify-center">
              <p className="text-red-500">Error loading data</p>
            </div>
          ) : chartData().length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <p>No data available</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {topOrgsData.data?.organizations.map((org, index) => (
                  <label
                    key={org.organization_id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedOrgs.includes(org.organization_id)}
                      onCheckedChange={() =>
                        toggleOrgSelection(org.organization_id)
                      }
                    />
                    <div
                      className="h-2 w-2 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor: `hsl(${(index * 360) / 14}, 70%, 50%)`,
                      }}
                    />
                    <span className={`text-sm ${
                      !selectedOrgs.includes(org.organization_id)
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}>
                      {org.organization_name}
                    </span>
                  </label>
                ))}
              </div>

              <LineChart
                className="mt-6 h-96"
                data={chartData()}
                index="time"
                categories={chartCategories}
                colors={chartColors.slice(0, chartCategories.length)}
                valueFormatter={(value) => formatLargeNumber(value)}
                showLegend={true}
                showGridLines={true}
                showYAxis={true}
                showXAxis={true}
                showAnimation={true}
                curveType="monotone"
                connectNulls={true}
                yAxisWidth={80}
              />
            </>
          )}
        </div>
      </div>

      {!topOrgsData.isLoading && topOrgsData.data?.organizations && (
        <div className="flex flex-col gap-4">
          <H2>Organization Details</H2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topOrgsData.data.organizations.map((org, index) => (
              <div
                key={org.organization_id}
                className={`rounded-lg border border-border bg-card shadow-sm transition-opacity duration-200 ${
                  selectedOrgs.includes(org.organization_id)
                    ? "opacity-100"
                    : "opacity-50"
                }`}
              >
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedOrgs.includes(org.organization_id)}
                      onCheckedChange={() =>
                        toggleOrgSelection(org.organization_id)
                      }
                    />
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded-full"
                      style={{
                        backgroundColor: `hsl(${(index * 360) / 14}, 70%, 50%)`,
                      }}
                    />
                    <H3 className="truncate">{org.organization_name}</H3>
                  </div>
                  <div className="flex flex-col gap-1 pl-6">
                    <P className="text-sm">
                      <span className="font-medium">Total Requests:</span>{" "}
                      {formatLargeNumber(
                        org.data.reduce(
                          (sum, point) => sum + point.request_count,
                          0,
                        ),
                      )}
                    </P>
                    <Small className="text-muted-foreground truncate">
                      {org.organization_id}
                    </Small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTopOrgs;
