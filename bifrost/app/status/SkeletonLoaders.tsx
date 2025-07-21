import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function StatusCardSkeleton() {
  return (
    <Card className="h-[120px] border shadow-none">
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="h-8 w-2/3 animate-pulse rounded bg-gray-200"></div>
          <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200"></div>
        </div>
        <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200"></div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="border shadow-none">
      <CardHeader>
        <div className="h-7 w-2/3 animate-pulse rounded bg-gray-200"></div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full animate-pulse rounded-md bg-gray-100">
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-1/2 w-3/4 rounded bg-gray-200 opacity-50"></div>
          </div>
        </div>
        <div className="mt-4 flex w-full">
          <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="mt-2">
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="h-[120px] border shadow-none">
      <CardHeader className="pb-2">
        <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200"></div>
      </CardHeader>
      <CardContent>
        <div className="h-10 w-1/3 animate-pulse rounded bg-gray-200"></div>
        <div className="mt-2 h-5 w-1/2 animate-pulse rounded bg-gray-200"></div>
      </CardContent>
    </Card>
  );
}

export function LatencyChartSkeleton() {
  return (
    <Card className="border shadow-none">
      <CardHeader>
        <div className="h-7 w-2/3 animate-pulse rounded bg-gray-200"></div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full animate-pulse rounded-md bg-gray-100">
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-1/2 w-3/4 rounded bg-gray-200 opacity-50"></div>
          </div>
        </div>
        <div className="mt-4 flex w-full">
          <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200"></div>
        </div>
        <div className="mt-2">
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TimeFrameButtonsSkeleton() {
  return (
    <div className="mb-4 flex justify-end gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-8 w-12 animate-pulse rounded-md bg-gray-200"
        ></div>
      ))}
    </div>
  );
}

export function ProvidersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold">
              <div className="h-5 w-20 animate-pulse rounded bg-gray-200"></div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="h-5 w-16 animate-pulse rounded bg-gray-200"></div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="h-5 w-28 animate-pulse rounded bg-gray-200"></div>
              <div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200"></div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
              <div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200"></div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
              <div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200"></div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow
              key={i}
              className="bg-white transition-colors hover:bg-gray-50/50"
            >
              <TableCell className="p-4">
                <div className="h-5 w-24 animate-pulse rounded bg-gray-200"></div>
              </TableCell>
              <TableCell className="p-4">
                <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200"></div>
              </TableCell>
              <TableCell className="p-4">
                <div className="h-5 w-16 animate-pulse rounded bg-gray-200"></div>
              </TableCell>
              <TableCell className="p-4">
                <div className="h-5 w-16 animate-pulse rounded bg-gray-200"></div>
              </TableCell>
              <TableCell className="p-4">
                <div className="h-5 w-16 animate-pulse rounded bg-gray-200"></div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ProviderStatusInfoSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="lg:col-span-5">
        <TimeFrameButtonsSkeleton />
      </div>

      <div className="space-y-4 lg:col-span-3">
        <StatusCardSkeleton />
        <ChartSkeleton />
      </div>

      <div className="space-y-4 lg:col-span-2">
        <MetricCardSkeleton />
        <LatencyChartSkeleton />
      </div>
    </div>
  );
}
