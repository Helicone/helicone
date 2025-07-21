"use client";

import { useRouter } from "next/navigation";
import { useHeliconeLogin } from "../useHeliconeLogin";
import Link from "next/link";

import { JetBrains_Mono } from "next/font/google";
import { useTestAPIKey } from "../first_page/useTestApiKey";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const TotalCost = () => {
  const { apiKey } = useHeliconeLogin();
  const { data, isLoading } = useTestAPIKey(apiKey.data ?? "");
  const router = useRouter();
  const jawn = useJawnClient(apiKey.data ?? "");

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
      className={`flex h-[100vh] w-full flex-col items-center justify-center gap-4 p-5 ${jetbrainsMono.className}`}
    >
      <div className="relative h-[360px] w-full border-2 border-black bg-white">
        <div className="absolute left-[18px] top-[22px] flex flex-col gap-[3px] border-2 border-b-4 border-r-4 border-black bg-white p-2.5">
          <div className="text-[14px] font-medium">Total Cost</div>
          <div className="text-[21px] font-extrabold">
            $
            {costsOverTimeData
              ?.reduce((sum, item) => sum + item.cost, 0)
              ?.toFixed(2) ?? "0.00"}
          </div>
        </div>
        <div className="absolute right-[18px] top-[22px] z-10 flex items-center gap-3 border-2 border-b-4 border-r-4 border-black bg-white px-3 py-1">
          <div className="h-[9.14px] w-[9.14px] border-2 border-b-4 border-r-4 border-black bg-[#E5E5E5]"></div>
          <div className="text-[14px] font-medium leading-tight">costs</div>
        </div>
        <ResponsiveContainer width="100%" height="100%" className="m-0 p-0">
          <BarChart data={costsOverTimeData ?? []} className="m-0 p-0">
            <CartesianGrid
              vertical={false}
              color="#000000"
              opacity={0.3}
              strokeWidth={1.52}
            />
            <XAxis
              dataKey="created_at_trunc"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(undefined, {
                  month: "numeric",
                  day: "numeric",
                  year: "2-digit",
                })
              }
              includeHidden
              interval={6}
              tickSize={14}
              padding={{ left: 16, right: 16 }}
              tickMargin={8}
              fontSize={12}
              strokeWidth={1.52}
              stroke="#000000"
            />
            {/* <YAxis fontSize={12} /> */}
            <Bar
              dataKey="cost"
              fill="#888888"
              radius={[0, 0, 0, 0]}
              stroke="#000000" // Add black outline
              strokeWidth={1.52} // Set outline thickness
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex w-full items-center justify-between">
        <Link href="/pi/total-requests">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/static/pi/arrow-left.webp"
            alt="arrow-left"
            className="h-16 w-16"
          />
        </Link>

        <Link href="/pi/total-requests">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/static/pi/arrow-right.webp"
            alt="arrow-right"
            className="h-16 w-16"
          />
        </Link>
      </div>
    </div>
  );
};

export default TotalCost;
