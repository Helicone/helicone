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
          <Skeleton className="h-8 w-48 mb-6 bg-slate-200 dark:bg-slate-700" />
          <div className="w-full h-[400px] flex items-center justify-center">
            <div className="relative w-[300px] h-[300px]">
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
          <Card className="rounded-none border-0 shadow-none">
            <CardContent className="flex flex-col items-center p-6">
              <h3 className="text-lg font-medium mb-6">
                Top Costs by {property}
              </h3>
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topCosts.data?.data?.data}
                      dataKey="cost"
                      nameKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      innerRadius={80}
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
                              name.length > 15
                                ? name.substring(0, 15) + "..."
                                : name
                            }`
                          : "Empty"
                      }
                    >
                      {topCosts.data?.data?.data.map(
                        (
                          entry: { value: string; cost: number },
                          index: number
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
                        )
                      )}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                              <p className="font-medium text-sm mb-1">
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
