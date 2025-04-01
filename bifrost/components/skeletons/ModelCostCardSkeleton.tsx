import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export function ModelCostCardSkeleton() {
  return (
    <Card className="p-4">
      <CardHeader className="p-0 mb-4 mt-1">
        {/* Title Skeleton */}
        <div className="flex items-center gap-2 text-slate-900">
          <Calculator className="w-4 h-4 text-slate-300" />
          <Skeleton className="h-5 w-36" />
        </div>
        {/* Subtitle Skeleton */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-4 h-4 relative opacity-10"></div>
          <Skeleton className="h-4 w-48" />
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-3">
        {/* Cost Line Skeletons (repeat pattern) */}
        <div className="flex justify-between items-center pl-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between items-center pl-2 pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="h-[1px] border-t border-slate-100 pt-2"></div>

        <div className="flex justify-between items-center pl-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between items-center pl-2 pb-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="h-[1px] border-t border-slate-100 pt-2"></div>

        <div className="flex justify-between items-center pl-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>

        <div className="pt-1"></div>

        {/* Helicone Promo Skeleton */}
        <div className="flex bg-slate-50 border-slate-100 border-2 rounded-lg justify-left items-left px-4 py-3 flex-col gap-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2 mb-1" />
          <div className="mt-2">
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
