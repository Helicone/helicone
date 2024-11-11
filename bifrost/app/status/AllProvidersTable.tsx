"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatProviderName,
  humanReadableNumber,
} from "../utils/formattingUtils";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { components } from "@/lib/clients/jawnTypes/public";

function TrendIndicator({ change }: { change: number }) {
  if (Math.abs(change) < 0.1) return null;

  const isPositive = change > 0;
  return (
    <span
      className={`inline-flex items-center ml-2 ${
        isPositive ? "text-red-500" : "text-green-500"
      }`}
    >
      {isPositive ? (
        <ArrowUpIcon className="h-4 w-4" />
      ) : (
        <ArrowDownIcon className="h-4 w-4" />
      )}
      <span className="text-xs ml-1">{Math.abs(change).toFixed(1)}%</span>
    </span>
  );
}

interface AllProvidersTableProps {
  providers: components["schemas"]["ProviderMetrics"][];
}

export function AllProvidersTable({ providers }: AllProvidersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Avg Latency Per Token (24h)</TableHead>
          <TableHead>Error Rate (10m)</TableHead>
          <TableHead>Error Rate (24h)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map((providerInfo) => {
          const providerName = formatProviderName(providerInfo.providerName);
          const {
            totalRequests,
            requestVolumeChange,
            errorRate24h,
            errorRateChange,
            timeSeriesData,
          } = providerInfo.metrics;

          const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
          const recentData = timeSeriesData.filter(
            (entry) => new Date(entry.timestamp) >= tenMinutesAgo
          );
          const recentErrorRate = recentData.length
            ? recentData.reduce((acc, curr) => acc + curr.errorRate, 0) /
              recentData.length
            : 0;

          return (
            <TableRow key={providerName} className="hover:bg-gray-50">
              <TableCell className="p-0">
                <Link
                  href={`/status/provider/${providerName}`}
                  className="block w-full h-full px-6 py-2"
                >
                  {providerName}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link
                  href={`/status/provider/${providerName}`}
                  className="block w-full h-full px-6 py-2"
                >
                  {recentErrorRate < 5 ? (
                    <span className="text-green-500">Online</span>
                  ) : recentErrorRate < 15 ? (
                    <span className="text-yellow-500">Degraded</span>
                  ) : (
                    <span className="text-red-500">Down</span>
                  )}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap p-0">
                <Link
                  href={`/status/provider/${providerName}`}
                  className="block w-full h-full px-6 py-2"
                >
                  {providerInfo.metrics.averageLatencyPerToken.toFixed(0)}ms
                  <TrendIndicator
                    change={providerInfo.metrics.latencyPerTokenChange}
                  />
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link
                  href={`/status/provider/${providerName}`}
                  className="block w-full h-full px-6 py-2"
                >
                  {recentErrorRate.toFixed(2)}%
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap p-0">
                <Link
                  href={`/status/provider/${providerName}`}
                  className="block w-full h-full px-6 py-2"
                >
                  {errorRate24h.toFixed(2)}%
                  <TrendIndicator change={errorRateChange} />
                </Link>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
