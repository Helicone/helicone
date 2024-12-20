"use client";

import { useRouter } from "next/navigation";
import { useHeliconeLogin } from "../useHeliconeLogin";

import { JetBrains_Mono } from "next/font/google";
import { useTestAPIKey } from "../first_page/useTestApiKey";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useQuery } from "@tanstack/react-query";
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

  if (!data && !isLoading && !apiKey.data && !apiKey.isLoading) {
    router.push("/pi/setup?invalid_api_key=true");
    return null;
  }

  return (
    <div
      className={`w-full flex flex-col justify-center items-center h-[100vh] p-5 ${jetbrainsMono.className}`}
    >
      {totalRequests.data?.data?.data}
      <div className="h-full w-full">{children}</div>
      <div className="flex justify-between items-center">
        <img
          src="/static/pi/arrow-left.png"
          alt="arrow-left"
          className="w-16 h-16"
        />
      </div>
    </div>
  );
};

export default PiGraphLayout;
