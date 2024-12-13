"use client";

import { useJawnClient } from "../../lib/clients/jawnHook";
import { useState, useEffect } from "react";
import { AllProvidersTable } from "./AllProvidersTable";
import { ProviderStatusInfo } from "./ProviderStatusInfo";
import { components } from "@/lib/clients/jawnTypes/public";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { StatusFAQ } from "./StatusFAQ";

export const getProviderStatus = (errorRate: number) => {
  if (errorRate <= 2) {
    return {
      status: "Online",
      description: "Normal operation",
      icon: CheckCircle,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
    };
  } else if (errorRate <= 10) {
    return {
      status: "Degraded",
      description: "Minor disruption",
      icon: AlertTriangle,
      color: "text-amber-700",
      bgColor: "bg-amber-50",
    };
  } else if (errorRate <= 25) {
    return {
      status: "Critical",
      description: "Severe disruption",
      icon: AlertTriangle,
      color: "text-orange-700",
      bgColor: "bg-orange-50",
    };
  } else {
    return {
      status: "Down",
      description: "Major disruption",
      icon: XCircle,
      color: "text-red-700",
      bgColor: "bg-red-50",
    };
  }
};

type ProviderStatusPageProps = {
  provider: string | "all";
};

export type TimeFrame = "24h" | "7d" | "30d";

export function ProviderStatusPage({ provider }: ProviderStatusPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jawnClient = useJawnClient();
  const [allProviderStatus, setAllProviderStatus] = useState<
    components["schemas"]["ProviderMetrics"][]
  >([]);
  const [isLoading, setIsLoading] = useState({ all: true, detailed: false });
  const [error, setError] = useState<{ all?: string; detailed?: string }>({});
  const [selectedProvider, setSelectedProvider] = useState<
    components["schemas"]["ProviderMetrics"] | null
  >(null);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(
    (searchParams.get("timeFrame") as TimeFrame) || "24h"
  );

  const updateUrlParams = (newTimeFrame: TimeFrame) => {
    const params = new URLSearchParams(searchParams);
    params.set("timeFrame", newTimeFrame);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleTimeFrameChange = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame);
    updateUrlParams(newTimeFrame);
  };

  useEffect(() => {
    async function fetchAllProviderStatus() {
      setIsLoading((prev) => ({ ...prev, all: true }));
      try {
        const response = await jawnClient.GET("/v1/public/status/provider");
        setAllProviderStatus(response.data?.data ?? []);
      } catch (error) {
        console.error("Failed to fetch all provider status:", error);
        setError((prev) => ({
          ...prev,
          all: "Failed to fetch provider statuses",
        }));
      } finally {
        setIsLoading((prev) => ({ ...prev, all: false }));
      }
    }

    fetchAllProviderStatus();
  }, []);

  useEffect(() => {
    if (provider === "all") {
      setSelectedProvider(null);
      return;
    }

    async function fetchDetailedStatus() {
      setIsLoading((prev) => ({ ...prev, detailed: true }));
      try {
        const response = await jawnClient.GET(
          "/v1/public/status/provider/{provider}",
          {
            params: { path: { provider }, query: { timeFrame } },
          }
        );

        setSelectedProvider(response.data?.data ?? null);
      } catch (error) {
        console.error("Failed to fetch detailed provider status:", error);
        setError((prev) => ({
          ...prev,
          detailed: "Failed to fetch detailed metrics",
        }));
      } finally {
        setIsLoading((prev) => ({ ...prev, detailed: false }));
      }
    }

    fetchDetailedStatus();
  }, [provider, timeFrame]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
      <ProviderStatusInfo
        provider={selectedProvider}
        timeFrame={timeFrame}
        onTimeFrameChange={handleTimeFrameChange}
      />

      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full whitespace-nowrap">
              Pro Tip
            </div>
            <p className="text-gray-600">
              Want advanced LLM monitoring and reliability tools?
              <a
                href="/signup"
                className="text-blue-600 font-medium hover:text-blue-700 ml-2"
              >
                Get started for free →
              </a>
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">All Providers</h2>
        {isLoading.all ? (
          <div>Loading...</div>
        ) : error.all ? (
          <div className="text-red-500">{error.all}</div>
        ) : (
          <AllProvidersTable providers={allProviderStatus} />
        )}
      </div>
      <i className="text-sm text-gray-500">
        Lighting speeds powered by{" "}
        <a
          href="https://clickhouse.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Clickhouse Cloud
        </a>
      </i>
      <StatusFAQ provider={provider} />
    </div>
  );
}
