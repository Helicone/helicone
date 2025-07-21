import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export function ModelCostCardSkeleton() {
  return (
    <Card className="p-4">
      <CardHeader className="mb-4 mt-1 p-0">
        {/* Title Skeleton */}
        <div className="flex items-center gap-2 text-slate-900">
          <Calculator className="h-4 w-4 text-slate-300" />
          <Skeleton className="h-5 w-36" />
        </div>
        {/* Subtitle Skeleton */}
        <div className="mt-2 flex items-center gap-2">
          <div className="relative h-4 w-4 opacity-10"></div>
          <Skeleton className="h-4 w-48" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        {/* Cost Line Skeletons (repeat pattern) */}
        <div className="flex items-center justify-between pl-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center justify-between pb-2 pl-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="h-[1px] border-t border-slate-100 pt-2"></div>

        <div className="flex items-center justify-between pl-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center justify-between pb-2 pl-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="h-[1px] border-t border-slate-100 pt-2"></div>

        <div className="flex items-center justify-between pl-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="pt-1"></div>

        {/* Helicone Promo Skeleton */}
        <div className="justify-left items-left flex flex-col gap-1 rounded-lg border-2 border-slate-100 bg-slate-50 px-4 py-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mb-1 h-4 w-1/2" />
          <div className="mt-2">
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
