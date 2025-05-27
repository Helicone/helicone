"use client";

import { useJawnClient } from "@/lib/clients/jawnHook";
import { JetBrains_Mono } from "next/font/google";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useHeliconeLogin } from "./../useHeliconeLogin";
import { useTestAPIKey } from "./useTestApiKey";
import { useQuery } from "@tanstack/react-query";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const FirstPageContent = () => {
  const { apiKey, sessionUUID } = useHeliconeLogin();
  const { data, isLoading } = useTestAPIKey(apiKey.data ?? "");
  const jawn = useJawnClient(apiKey.data ?? "");
  const router = useRouter();

  useEffect(() => {
    if (!data && !isLoading && !apiKey.data && !apiKey.isLoading) {
      router.push("/pi/setup?invalid_api_key=true");
    } else {
      router.push("/pi/total-requests");
    }
  }, [data, isLoading, apiKey.data, apiKey.isLoading, router]);

  const orgName = useQuery({
    queryKey: ["org-name", apiKey.data],
    queryFn: () => jawn.POST("/v1/pi/org-name/query"),
  });

  const totalCosts = useQuery({
    queryKey: ["total-costs", apiKey.data],
    queryFn: () => jawn.POST("/v1/pi/total-costs"),
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

  return <div>Loading...</div>;
};

const PiPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FirstPageContent />
    </Suspense>
  );
};

export default PiPage;
