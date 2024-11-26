"use client";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useSearchParams } from "next/navigation";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ModelComparisonPage({
  modelA,
  modelB,
}: {
  modelA: string;
  modelB: string;
}) {
  const jawnClient = useJawnClient();
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState({ comparison: true });
  const [error, setError] = useState<{ comparison?: string }>({});

  useEffect(() => {
    async function fetchComparisonData() {
      setIsLoading((prev) => ({ ...prev, comparison: true }));
      try {
        const response = await jawnClient.GET(
          "/v1/public/comparison/{modelA}-vs-{modelB}",
          {
            params: {
              path: {
                modelA,
                modelB,
              },
            },
          }
        );
        setComparisonData(response.data?.data ?? null);
      } catch (error) {
        console.error("Failed to fetch comparison:", error);
        setError((prev) => ({
          ...prev,
          comparison: "Failed to load comparison data",
        }));
      } finally {
        setIsLoading((prev) => ({ ...prev, comparison: false }));
      }
    }

    fetchComparisonData();
  }, [modelA, modelB]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold">
        {modelA} vs {modelB}
      </h1>

      {isLoading.comparison ? (
        <div>Loading comparison data...</div>
      ) : error.comparison ? (
        <div className="text-red-500">{error.comparison}</div>
      ) : (
        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
          {JSON.stringify(comparisonData, null, 2)}
        </pre>
      )}
    </div>
  );
}
