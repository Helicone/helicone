"use client";

import { useRouter } from "next/navigation";
import { useHeliconeLogin } from "../useHeliconeLogin";
import Link from "next/link";

import { JetBrains_Mono } from "next/font/google";
import { useTestAPIKey } from "../first_page/useTestApiKey";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const PiGraphLayout = ({ children }: { children: React.ReactNode }) => {
  const { apiKey } = useHeliconeLogin();
  const { data, isLoading } = useTestAPIKey(apiKey.data ?? "");
  const router = useRouter();

  const jawn = useJawnClient(apiKey.data ?? "");

  const totalRequests = useQuery({
    queryKey: ["total-requests", apiKey.data],
    queryFn: () => jawn.POST("/v1/pi/total_requests"),
  });

  const costsOverTime = useQuery({
    queryKey: ["costs-over-time", apiKey.data],
    queryFn: () =>
      jawn.POST("/v1/pi/costs-over-time/query", {
        body: {
          userFilter: "all",
          dbIncrement: "day",
          timeZoneDifference: new Date().getTimezoneOffset(),
          timeFilter: {
            start: new Date(
              Date.now() - 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            end: new Date().toISOString(),
          },
        },
      }),
  });
  const costsOverTimeData = costsOverTime.data?.data?.data;

  if (!data && !isLoading && !apiKey.data && !apiKey.isLoading) {
    router.push("/pi/setup?invalid_api_key=true");
    return null;
  }

  return (
    <div
      className={`w-full flex flex-col justify-center items-center h-[100vh] p-5 ${jetbrainsMono.className}`}
    >
      <div className="w-full h-[400px] p-4 bg-background">
        <h2 className="text-2xl font-bold mb-4">Costs</h2>
        <div className="text-3xl font-bold">
          $
          {costsOverTimeData
            ?.reduce((sum, item) => sum + item.cost, 0)
            ?.toFixed(2) ?? "0.00"}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={costsOverTimeData ?? []}>
            <XAxis
              dataKey="created_at_trunc"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(undefined, {
                  month: "numeric",
                  day: "numeric",
                })
              }
              fontSize={12}
              interval={4} // Show every 4th tick
            />
            <YAxis fontSize={12} />
            <Bar
              dataKey="cost"
              fill="#888888"
              radius={[0, 0, 0, 0]}
              stroke="#000000" // Add black outline
              strokeWidth={1} // Set outline thickness
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-full w-full">{children}</div>
      <div className="flex justify-between items-center w-full">
        <Link href="/pi/total-requests">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/static/pi/arrow-left.png"
            alt="arrow-left"
            className="w-16 h-16"
          />
        </Link>

        <Link href="/pi/total-requests">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/static/pi/arrow-right.png"
            alt="arrow-right"
            className="w-16 h-16"
          />
        </Link>
      </div>
    </div>
  );
};

export default PiGraphLayout;
