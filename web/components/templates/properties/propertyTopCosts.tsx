import { useQuery } from "@tanstack/react-query";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { H4 } from "@/components/ui/typography";

interface PropertyTopCostsProps {
  property: string;
  timeFilter: {
    start: Date;
    end: Date;
  };
}

const PropertyTopCosts = ({ property, timeFilter }: PropertyTopCostsProps) => {
  const jawn = useJawnClient();
  const topCosts = useQuery({
    queryKey: ["topCosts", property, timeFilter?.start, timeFilter?.end],
    queryFn: () =>
      jawn.POST("/v1/property/{propertyKey}/top-costs/query", {
        params: {
          path: {
            propertyKey: property,
          },
        },
        body: {
          timeFilter: {
            start: timeFilter.start.toISOString(),
            end: timeFilter.end.toISOString(),
          },
        },
      }),
    enabled: !!property,
  });

  if (!property) {
    return <div>No property selected</div>;
  }

  // Show skeleton loading while data is being fetched
  if (topCosts.isLoading) {
    return (
      <Card className="rounded-none border-0 shadow-none">
        <CardContent className="flex flex-col items-center p-6">
          <Skeleton className="mb-6 h-8 w-48 bg-slate-200 dark:bg-slate-700" />
          <div className="flex min-h-[300px] w-full items-center justify-center">
            <div className="relative h-[250px] w-[250px]">
              {/* Outer circle skeleton */}
              <Skeleton className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-700" />
              {/* Inner circle skeleton (for donut chart effect) */}
              <div className="absolute inset-[80px] rounded-full bg-white dark:bg-black" />

              {/* Legend skeleton items */}
              <div className="absolute bottom-[-80px] left-0 right-0 flex flex-wrap justify-center gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-sm bg-slate-300 dark:bg-slate-600" />
                    <Skeleton className="h-4 w-20 bg-slate-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {topCosts.data?.data?.data &&
        Array.isArray(topCosts.data?.data?.data) && (
          <Card className="rounded-none border-0 bg-background shadow-none dark:bg-sidebar-background">
            <CardContent className="flex flex-col items-center p-4 md:p-6">
              <H4 className="mb-4">Top Costs by {property}</H4>
              <div className="max-h-[400px] min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 25, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={topCosts.data?.data?.data}
                      dataKey="cost"
                      nameKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                      innerRadius="40%"
                      paddingAngle={3}
                      label={({
                        value,
                        name,
                        percent,
                      }: {
                        value: number;
                        name: string;
                        percent: number;
                      }) =>
                        name
                          ? `${
                              name.length > 10
                                ? name.substring(0, 10) + "..."
                                : name
                            }`
                          : "Empty"
                      }
                    >
                      {topCosts.data?.data?.data.map(
                        (
                          entry: { value: string; cost: number },
                          index: number,
                        ) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                "#4f46e5", // indigo-600
                                "#0ea5e9", // sky-500
                                "#10b981", // emerald-500
                                "#f59e0b", // amber-500
                                "#ef4444", // red-500
                                "#8b5cf6", // violet-500
                                "#ec4899", // pink-500
                                "#06b6d4", // cyan-500
                                "#f97316", // orange-500
                                "#84cc16", // lime-500
                                "#6366f1", // indigo-500
                              ][index % 11]
                            }
                            strokeWidth={1}
                            stroke="#ffffff"
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                              <p className="mb-1 text-sm font-medium">
                                {data.name || "Empty"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Cost:{" "}
                                <span className="font-medium">
                                  {data.value}
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: 20 }}
                      formatter={(value) => {
                        return value ? (
                          <span className="text-xs font-medium">
                            {value.length > 20
                              ? value.substring(0, 20) + "..."
                              : value}
                          </span>
                        ) : (
                          "Empty"
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
    </>
  );
};

export default PropertyTopCosts;
