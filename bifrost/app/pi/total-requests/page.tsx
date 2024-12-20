"use client";

import { useRouter } from "next/navigation";
import { useHeliconeLogin } from "../useHeliconeLogin";

import { JetBrains_Mono } from "next/font/google";
import { useTestAPIKey } from "../first_page/useTestApiKey";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const formatNumber = (
  number: number
): [
  number | null,
  number | null,
  "." | "," | number | null,
  number | null | ".",
  number | null,
  number | null | "B" | "M"
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
      className={`w-full flex flex-col justify-center items-center h-[100vh] p-5 gap-4 ${jetbrainsMono.className}`}
    >
      <div className="h-full w-full bg-[#E5E5E5] border-2 border-black flex flex-col items-center justify-center gap-7">
        <div className="bg-white p-2.5 border-2 border-black border-r-4 border-b-4 font-medium text-[21px]">
          Total Requests
        </div>{" "}
        <div className="flex gap-2">
          {formatNumber(totalRequests.data?.data?.data ?? 0).map(
            (num, index) => (
              <div
                key={index}
                className="h-[120px] w-[82px] bg-white border-2 border-black border-r-4 border-b-4 text-[76px] font-extrabold flex items-center justify-center"
              >
                {num}
              </div>
            )
          )}
        </div>
        <div className="bg-white p-2.5 border-2 border-black border-r-4 border-b-4 font-medium text-[14px]">
          Last 30 days
        </div>
        {/* {JSON.stringify(formatNumber(totalRequests.data?.data?.data ?? 0))} */}
      </div>
      <div className="flex w-full justify-between items-center">
        <img
          src="/static/pi/arrow-left.png"
          alt="arrow-left"
          className="w-16 h-16"
        />
        <div className="flex flex-col items-center">
          <img
            src="/static/pi/arrow-right.png"
            alt="arrow-left"
            className="w-16 h-16"
          />
        </div>
      </div>
    </div>
  );
};

export default TotalRequestsPage;
