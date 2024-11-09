"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { providers } from "../../packages/cost/providers/mappings"; // Ensure the path is correct
import { formatProviderName } from "../utils/formattingUtils";
import { useJawnClient } from "../../lib/clients/jawnHook";
import { useState, useEffect } from "react";
import { humanReadableNumber } from "../utils/formattingUtils";

interface ProviderErrorRate {
  interval: string;
  errorRate: number;
  totalRequests: number;
}

export function ProviderStatusPage({ provider }: { provider?: string }) {
  const decodedProvider = decodeURIComponent(provider || "");
  const jawnClient = useJawnClient();
  const [providerStatus, setProviderStatus] = useState<{
    [provider: string]: {
      interval: string;
      errorRate: number;
      totalRequests: number;
    }[];
  }>({});

  /*
    const { data: promptTemplate } = useQuery(
    ["promptTemplate", promptVersionId],
    async () => {
      if (!props.context.orgId || !promptVersionId) return null;

      const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
        params: {
          path: {
            promptVersionId: promptVersionId,
          },
        },
      });
      return res.data?.data;
    },
    {
      enabled:
        !!props.context.orgId && !!promptVersionId && showPromptPlayground,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  );
  */

  useEffect(() => {
    let mounted = true;

    async function fetchProviderStatus() {
      try {
        const promises = providers.map(async (providerInfo) => {
          const response = await jawnClient.GET(
            "/v1/public/status/provider/{provider}",
            {
              params: { path: { provider: providerInfo.provider } },
            }
          );

          if (mounted && response.data?.data) {
            setProviderStatus((prev) => ({
              ...prev,
              [providerInfo.provider]: response.data
                .data as unknown as ProviderErrorRate[],
            }));
          }
        });

        await Promise.all(promises);
      } catch (error) {
        console.error("Failed to fetch provider status:", error);
      }
    }

    fetchProviderStatus();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array since we only want to fetch once

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Provider Status</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Error Rate</TableHead>
            <TableHead>Total Requests (24h)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((providerInfo) => {
            const status = providerStatus[providerInfo.provider]?.[0];
            const errorRate = status?.errorRate ?? 0;
            const totalRequests = status?.totalRequests ?? 0;

            return (
              <TableRow key={formatProviderName(providerInfo.provider)}>
                <TableCell>
                  {formatProviderName(providerInfo.provider)}
                </TableCell>
                <TableCell>
                  {errorRate < 5 ? (
                    <span className="text-green-500">Online</span>
                  ) : (
                    <span className="text-red-500">Degraded</span>
                  )}
                </TableCell>
                <TableCell>{status?.interval ?? "N/A"}</TableCell>
                <TableCell>{errorRate.toFixed(2)}%</TableCell>
                <TableCell>{humanReadableNumber(totalRequests)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
