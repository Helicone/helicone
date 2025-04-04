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
    <Card className="shadow-none border h-[120px]">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="shadow-none border">
      <CardHeader>
        <div className="h-7 w-2/3 bg-gray-200 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full bg-gray-100 rounded-md animate-pulse">
          <div className="h-full w-full flex items-center justify-center">
            <div className="h-1/2 w-3/4 bg-gray-200 rounded opacity-50"></div>
          </div>
        </div>
        <div className="mt-4 flex w-full">
          <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mt-2">
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <Card className="shadow-none border h-[120px]">
      <CardHeader className="pb-2">
        <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="h-10 w-1/3 bg-gray-200 rounded animate-pulse"></div>
        <div className="mt-2 h-5 w-1/2 bg-gray-200 rounded animate-pulse"></div>
      </CardContent>
    </Card>
  );
}

export function LatencyChartSkeleton() {
  return (
    <Card className="shadow-none border">
      <CardHeader>
        <div className="h-7 w-2/3 bg-gray-200 rounded animate-pulse"></div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full bg-gray-100 rounded-md animate-pulse">
          <div className="h-full w-full flex items-center justify-center">
            <div className="h-1/2 w-3/4 bg-gray-200 rounded opacity-50"></div>
          </div>
        </div>
        <div className="mt-4 flex w-full">
          <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="mt-2">
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TimeFrameButtonsSkeleton() {
  return (
    <div className="flex justify-end gap-2 mb-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-8 w-12 bg-gray-200 rounded-md animate-pulse"
        ></div>
      ))}
    </div>
  );
}

export function ProvidersTableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold">
              <div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
            </TableHead>
            <TableHead className="font-semibold">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mt-1"></div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow
              key={i}
              className="bg-white hover:bg-gray-50/50 transition-colors"
            >
              <TableCell className="p-4">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
              </TableCell>
              <TableCell className="p-4">
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
              </TableCell>
              <TableCell className="p-4">
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              </TableCell>
              <TableCell className="p-4">
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
              </TableCell>
              <TableCell className="p-4">
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div>
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
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-5">
        <TimeFrameButtonsSkeleton />
      </div>

      <div className="lg:col-span-3 space-y-4">
        <StatusCardSkeleton />
        <ChartSkeleton />
      </div>

      <div className="lg:col-span-2 space-y-4">
        <MetricCardSkeleton />
        <LatencyChartSkeleton />
      </div>
    </div>
  );
}
