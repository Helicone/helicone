"use client";

import { useRouter } from "next/navigation";
import { useHeliconeLogin } from "../useHeliconeLogin";

import { JetBrains_Mono } from "next/font/google";
import { useTestAPIKey } from "../first_page/useTestApiKey";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const formatNumber = (
  number: number
): [
  number | null,
  number | null,
  "." | "," | number | null,
  number | null | ".",
  number | null,
  number | null | "B" | "M",
] => {
  if (number < 10) {
    return [null, null, null, null, null, number];
  } else if (number < 100) {
    return [
      null,
      null,
      null,
      null,
      Number(number.toString().split("")[0]),
      Number(number.toString().split("")[1]),
    ];
  } else if (number < 1000) {
    return [
      null,
      null,
      null,
      Number(number.toString().split("")[0]),
      Number(number.toString().split("")[1]),
      Number(number.toString().split("")[2]),
    ];
  } else if (number < 10000) {
    return [
      null,
      Number(number.toString().split("")[0]),
      ",",
      Number(number.toString().split("")[1]),
      Number(number.toString().split("")[2]),
      Number(number.toString().split("")[3]),
    ];
  } else if (number < 100_000) {
    return [
      Number(number.toString().split("")[0]),
      Number(number.toString().split("")[1]),
      ",",
      Number(number.toString().split("")[2]),
      Number(number.toString().split("")[3]),
      Number(number.toString().split("")[4]),
    ];
  } else if (number < 1_000_000) {
    // 2,345,678 = _,2,.,3,4,M
    return [
      null,
      Number(number.toString().split("")[0]),
      ".",
      Number(number.toString().split("")[1]),
      Number(number.toString().split("")[2]),
      "M",
    ];
  } else if (number < 10_000_000) {
    // 23,456,789 = 2,3,.,4,5,M
    return [
      Number(number.toString().split("")[0]),
      Number(number.toString().split("")[1]),
      ".",
      Number(number.toString().split("")[2]),
      Number(number.toString().split("")[3]),
      "M",
    ];
  } else if (number < 100_000_000) {
    // 234,567,890 = 2,3,4,.,5,M
    return [
      Number(number.toString().split("")[0]),
      Number(number.toString().split("")[1]),
      Number(number.toString().split("")[2]),
      ".",
      Number(number.toString().split("")[3]),
      "M",
    ];
  } else if (number < 1_000_000_000) {
    // 245,678,901 = _,_,2,4,5,M
    return [
      null,
      null,
      Number(number.toString().split("")[0]),
      Number(number.toString().split("")[1]),
      Number(number.toString().split("")[2]),
      "M",
    ];
  } else if (number < 10_000_000_000) {
    // 1,234,567,890 = _,1,.,2,3,B
    return [
      null,
      Number(number.toString().split("")[0]),
      ".",
      Number(number.toString().split("")[1]),
      Number(number.toString().split("")[2]),
      "B",
    ];
  } else {
    return [null, null, null, null, null, null];
  }
};

const TotalRequestsPage = () => {
  const { apiKey } = useHeliconeLogin();
  const { data, isLoading } = useTestAPIKey(apiKey.data ?? "");
  const router = useRouter();

  const jawn = useJawnClient(apiKey.data ?? "");

  const totalRequests = useQuery({
    queryKey: ["total-requests", apiKey.data],
    queryFn: () => jawn.POST("/v1/pi/total_requests"),
  });

  if (!data && !isLoading && !apiKey.data && !apiKey.isLoading) {
    router.push("/pi/setup?invalid_api_key=true");
    return null;
  }

  return (
    <div
      className={`flex h-[100vh] w-full flex-col items-center justify-center gap-4 p-5 ${jetbrainsMono.className}`}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-7 border-2 border-black bg-[#E5E5E5]">
        <div className="border-2 border-b-4 border-r-4 border-black bg-white p-2.5 text-[21px] font-medium">
          Total Requests
        </div>{" "}
        <div className="flex gap-2">
          {formatNumber(totalRequests.data?.data?.data ?? 0).map(
            (num, index) => (
              <div
                key={index}
                className="flex h-[120px] w-[82px] items-center justify-center border-2 border-b-4 border-r-4 border-black bg-white text-[76px] font-extrabold"
              >
                {num}
              </div>
            )
          )}
        </div>
        <div className="border-2 border-b-4 border-r-4 border-black bg-white p-2.5 text-[14px] font-medium">
          Last 30 days
        </div>
        {/* {JSON.stringify(formatNumber(totalRequests.data?.data?.data ?? 0))} */}
      </div>
      <div className="flex w-full items-center justify-between">
        <Link href="/pi/total-cost">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/static/pi/arrow-left.webp"
            alt="arrow-left"
            className="h-16 w-16"
          />
        </Link>
        <Link href="/pi/total-cost">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/static/pi/arrow-right.webp"
            alt="arrow-left"
            className="h-16 w-16"
          />
        </Link>
      </div>
    </div>
  );
};

export default TotalRequestsPage;
