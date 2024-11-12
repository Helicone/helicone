"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatProviderName } from "../utils/formattingUtils";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { components } from "@/lib/clients/jawnTypes/public";
import { getProviderStatus } from "./ProviderStatusPage";
import { Badge } from "@/components/ui/badge";

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
        <ArrowUpIcon className="h-3.5 w-3.5" />
      ) : (
        <ArrowDownIcon className="h-3.5 w-3.5" />
      )}
      <span className="text-xs ml-0.5">{Math.abs(change).toFixed(1)}%</span>
    </span>
  );
}

interface AllProvidersTableProps {
  providers: components["schemas"]["ProviderMetrics"][];
}

export function AllProvidersTable({ providers }: AllProvidersTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold">Provider</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">
              Avg Latency Per Token
              <span className="block text-xs font-normal text-gray-500">
                Last 24 hours
              </span>
            </TableHead>
            <TableHead className="font-semibold">
              500 Error Rate
              <span className="block text-xs font-normal text-gray-500">
                Last 10 minutes
              </span>
            </TableHead>
            <TableHead className="font-semibold">
              500 Error Rate
              <span className="block text-xs font-normal text-gray-500">
                Last 24 hours
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((providerInfo) => {
            const providerName = formatProviderName(providerInfo.providerName);
            const {
              errorRate24h,
              errorRateChange,
              recentErrorCount,
              recentRequestCount,
            } = providerInfo.metrics;

            const recentErrorRate =
              recentRequestCount > 0
                ? (recentErrorCount / recentRequestCount) * 100
                : 0;

            const status = getProviderStatus(errorRate24h);
            const StatusIcon = status.icon;

            return (
              <TableRow
                key={providerName}
                className="bg-white hover:bg-gray-50/50 transition-colors"
              >
                <TableCell className="p-0 font-medium">
                  <Link
                    href={`/status/provider/${encodeURIComponent(
                      providerName
                    )}`}
                    className="block w-full h-full px-4 py-3 hover:text-blue-600 transition-colors"
                  >
                    {providerName}
                  </Link>
                </TableCell>
                <TableCell className="p-0">
                  <Link
                    href={`/status/provider/${encodeURIComponent(
                      providerName
                    )}`}
                    className="block w-full h-full px-4 py-3"
                  >
                    <Badge
                      variant="secondary"
                      className={`${status.bgColor} ${status.color} hover:${status.bgColor} px-3 py-1 text-sm font-medium`}
                    >
                      <StatusIcon className="w-4 h-4 mr-1.5" />
                      {status.status}
                    </Badge>
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap p-0">
                  <Link
                    href={`/status/provider/${encodeURIComponent(
                      providerName
                    )}`}
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
                    href={`/status/provider/${encodeURIComponent(
                      providerName
                    )}`}
                    className="block w-full h-full px-6 py-2"
                  >
                    {recentErrorRate.toFixed(4)}%
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap p-0">
                  <Link
                    href={`/status/provider/${encodeURIComponent(
                      providerName
                    )}`}
                    className="block w-full h-full px-6 py-2"
                  >
                    {errorRate24h.toFixed(4)}%
                    <TrendIndicator change={errorRateChange} />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
