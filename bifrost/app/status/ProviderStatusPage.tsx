"use client";

import { useJawnClient } from "../../lib/clients/jawnHook";
import { useState, useEffect } from "react";
import { AllProvidersTable } from "./AllProvidersTable";
import { ProviderStatusInfo } from "./ProviderStatusInfo";

type ProviderStatusPageProps = {
  provider: string | "all";
};

export type ProviderMetrics = {
  providerName: string;
  metrics: {
    totalRequests: number;
    requestCountPrevious24h: number;
    requestVolumeChange: number;
    errorRate24h: number;
    errorRatePrevious24h: number;
    errorRateChange: number;
    timeSeriesData: {
      timestamp: string;
      errorRate: number;
      errorCount: number;
      requestCount: number;
    }[];
  };
};

export function ProviderStatusPage({ provider }: ProviderStatusPageProps) {
  const jawnClient = useJawnClient();
  const [allProviderStatus, setAllProviderStatus] = useState<ProviderMetrics[]>(
    []
  );
  const [providerStatus, setProviderStatus] = useState<ProviderMetrics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState({ all: true, detailed: false });
  const [error, setError] = useState<{ all?: string; detailed?: string }>({});
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderMetrics | null>(null);

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
      setProviderStatus(null);
      setSelectedProvider(null);
      return;
    }

    async function fetchDetailedStatus() {
      setIsLoading((prev) => ({ ...prev, detailed: true }));
      try {
        const response = await jawnClient.GET(
          "/v1/public/status/provider/{provider}",
          {
            params: { path: { provider } },
          }
        );
        setProviderStatus(response.data?.data ?? null);
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
  }, [provider]);

  return (
    <div>
      <ProviderStatusInfo provider={selectedProvider} />
      <div className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-4">Provider Status</h2>
        {isLoading.all ? (
          <div>Loading...</div>
        ) : error.all ? (
          <div className="text-red-500">{error.all}</div>
        ) : (
          <AllProvidersTable providers={allProviderStatus} />
        )}
      </div>
    </div>
  );
}
