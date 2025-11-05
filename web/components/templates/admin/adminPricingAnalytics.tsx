import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getJawnClient } from "../../../lib/clients/jawn";
import { H2, H3, P, Small } from "@/components/ui/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Download, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useRef, useEffect } from "react";

interface OrganizationSegment {
  id: string;
  name: string;
  tier: string;
  created_at: string;
  seats: number;
  active_users_30d: number;
  requests_30d: number;
  llm_cost_30d: number;
  prompts_created: number;
  prompts_used_30d: number;
  mrr: number;
  stripe_customer_id: string;
  is_ptb: boolean;
  is_byok: boolean;
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat("en-US").format(num);
};

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};

const getTierBadgeColor = (tier: string) => {
  const colors: Record<string, string> = {
    free: "bg-slate-500",
    pro: "bg-sky-500",
    team: "bg-purple-500",
    enterprise: "bg-amber-500",
  };
  return colors[tier] || "bg-gray-500";
};

type SortField = "name" | "tier" | "seats" | "active_users_30d" | "requests_30d" | "llm_cost_30d" | "prompts_created" | "prompts_used_30d" | "mrr";
type SortDirection = "asc" | "desc";

const AdminPricingAnalytics = () => {
  const jawn = getJawnClient();
  const queryClient = useQueryClient();
  const [sortField, setSortField] = useState<SortField>("requests_30d");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayCount, setDisplayCount] = useState(100);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data: segments, isLoading } = useQuery({
    queryKey: ["admin", "pricing-segments"],
    queryFn: async () => {
      const response = await jawn.GET("/v1/admin/pricing-analytics/segments");
      return response.data?.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });

  const sortedSegments = useMemo(() => {
    if (!segments) return [];

    return [...segments].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [segments, sortField, sortDirection]);

  const visibleSegments = sortedSegments.slice(0, displayCount);

  // Reset display count when sorting changes
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setDisplayCount(100); // Reset to initial count
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleSegments.length < sortedSegments.length) {
          setDisplayCount(prev => Math.min(prev + 100, sortedSegments.length));
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [visibleSegments.length, sortedSegments.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin" size={32} />
        <P className="ml-2">Loading pricing data...</P>
      </div>
    );
  }

  const totalRequests = segments?.reduce((sum, s) => sum + s.requests_30d, 0) || 0;
  const totalCost = segments?.reduce((sum, s) => sum + s.llm_cost_30d, 0) || 0;
  const totalMRR = segments?.reduce((sum, s) => sum + s.mrr, 0) || 0;
  const grossMargin = totalMRR > 0 ? ((totalMRR - totalCost) / totalMRR) * 100 : 0;

  return (
    <div className="flex flex-col h-screen">
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-6">
        <div className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center gap-4">
            <Small className="text-muted-foreground font-medium">
              {formatNumber(segments?.length || 0)} organizations
            </Small>
            <div className="h-4 w-px bg-border" />
            <Small className="text-muted-foreground">
              {formatNumber(totalRequests)} requests
            </Small>
            <div className="h-4 w-px bg-border" />
            <Small className="text-muted-foreground">
              {formatCurrency(totalCost)} cost
            </Small>
            <div className="h-4 w-px bg-border" />
            <Small className="text-muted-foreground">
              {grossMargin.toFixed(1)}% margin
            </Small>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                queryClient.invalidateQueries(["admin", "pricing-segments"]);
                queryClient.fetchQuery({
                  queryKey: ["admin", "pricing-segments"],
                  queryFn: async () => {
                    const response = await jawn.GET("/v1/admin/pricing-analytics/segments", {
                      params: { query: { bustCache: true } }
                    });
                    return response.data?.data || [];
                  },
                });
              }}
              disabled={isLoading}
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                // TODO: Implement CSV export
                alert("Export coming soon!");
              }}
            >
              <Download size={14} />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="flex-1 overflow-auto px-6 pt-4">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead onClick={() => handleSort("name")} className="cursor-pointer w-[200px]">
                    <div className="flex items-center gap-1">
                      Organization
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("tier")} className="cursor-pointer w-[100px]">
                    <div className="flex items-center gap-1">
                      Tier
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("seats")} className="cursor-pointer text-right w-[100px]">
                    <div className="flex items-center gap-1 justify-end">
                      Seats
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("active_users_30d")} className="cursor-pointer text-right w-[120px]">
                    <div className="flex items-center gap-1 justify-end">
                      Active Users
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("requests_30d")} className="cursor-pointer text-right w-[150px]">
                    <div className="flex items-center gap-1 justify-end">
                      Requests (30d)
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("llm_cost_30d")} className="cursor-pointer text-right w-[150px]">
                    <div className="flex items-center gap-1 justify-end">
                      LLM Cost (30d)
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("prompts_created")} className="cursor-pointer text-right w-[130px]">
                    <div className="flex items-center gap-1 justify-end">
                      Prompts
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("prompts_used_30d")} className="cursor-pointer text-right w-[130px]">
                    <div className="flex items-center gap-1 justify-end">
                      Prompts Used
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("mrr")} className="cursor-pointer text-right w-[120px]">
                    <div className="flex items-center gap-1 justify-end">
                      MRR
                      <ArrowUpDown size={14} />
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[80px]">PTB</TableHead>
                  <TableHead className="text-center w-[80px]">BYOK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSegments.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium w-[200px] max-w-[200px] truncate" title={org.name}>
                      {org.name}
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <Badge className={getTierBadgeColor(org.tier)}>
                        {org.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right w-[100px]">
                      {formatNumber(org.seats)}
                    </TableCell>
                    <TableCell className="text-right w-[120px]">
                      {formatNumber(org.active_users_30d)}
                    </TableCell>
                    <TableCell className="text-right w-[150px]">
                      {formatNumber(org.requests_30d)}
                    </TableCell>
                    <TableCell className="text-right w-[150px]">
                      {formatCurrency(org.llm_cost_30d)}
                    </TableCell>
                    <TableCell className="text-right w-[130px]">
                      {formatNumber(org.prompts_created)}
                    </TableCell>
                    <TableCell className="text-right w-[130px]">
                      {formatNumber(org.prompts_used_30d)}
                    </TableCell>
                    <TableCell className="text-right w-[120px]">
                      {formatCurrency(org.mrr)}
                    </TableCell>
                    <TableCell className="text-center w-[80px]">
                      {org.is_ptb ? "✓" : ""}
                    </TableCell>
                    <TableCell className="text-center w-[80px]">
                      {org.is_byok ? "✓" : ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Infinite scroll trigger */}
            {visibleSegments.length < sortedSegments.length && (
              <div ref={observerTarget} className="h-10 flex items-center justify-center">
                <Loader2 className="animate-spin" size={16} />
              </div>
            )}
            </div>
      </div>
    </div>
  );
};

export default AdminPricingAnalytics;
