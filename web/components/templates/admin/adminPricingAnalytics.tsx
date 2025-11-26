import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "../../../lib/clients/jawn";
import { H2, H3, P, Small } from "@/components/ui/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
  bytes_total: number;
  hours_tracked: number;
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

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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

type SortField = "name" | "tier" | "seats" | "active_users_30d" | "requests_30d" | "llm_cost_30d" | "prompts_created" | "prompts_used_30d" | "mrr" | "bytes_total" | "hours_tracked";
type SortDirection = "asc" | "desc";

const AdminPricingAnalytics = () => {
  const jawn = getJawnClient();
  const [sortField, setSortField] = useState<SortField>("requests_30d");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayCount, setDisplayCount] = useState(100);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bustCacheRef = useRef(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={14} className="text-primary" />
    ) : (
      <ArrowDown size={14} className="text-primary" />
    );
  };

  const { data: segments, isLoading, refetch } = useQuery({
    queryKey: ["admin", "pricing-segments"],
    queryFn: async () => {
      const shouldBustCache = bustCacheRef.current;
      bustCacheRef.current = false; // Reset after use

      const response = await jawn.GET("/v1/admin/pricing-analytics/segments", {
        params: shouldBustCache ? { query: { bustCache: true } } : undefined
      });
      const rawData = response.data?.data || [];

      // Normalize all numeric fields to actual numbers
      const normalizedData = rawData.map((segment: any) => ({
        ...segment,
        seats: Number(segment.seats) || 0,
        active_users_30d: Number(segment.active_users_30d) || 0,
        requests_30d: Number(segment.requests_30d) || 0,
        llm_cost_30d: Number(segment.llm_cost_30d) || 0,
        prompts_created: Number(segment.prompts_created) || 0,
        prompts_used_30d: Number(segment.prompts_used_30d) || 0,
        mrr: Number(segment.mrr) || 0,
        bytes_total: Number(segment.bytes_total) || 0,
        hours_tracked: Number(segment.hours_tracked) || 0,
      }));

      return normalizedData;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });

  const sortedSegments = useMemo(() => {
    if (!segments) return [];

    return [...segments].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === "asc" ? -1 : 1;
      if (bVal == null) return sortDirection === "asc" ? 1 : -1;

      // String comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Numeric comparison (should always be numbers now after normalization)
      const aNum = Number(aVal);
      const bNum = Number(bVal);

      return sortDirection === "asc"
        ? aNum - bNum
        : bNum - aNum;
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

  // Export to CSV
  const handleExportCSV = () => {
    if (!sortedSegments || sortedSegments.length === 0) return;

    // Define CSV headers
    const headers = [
      "Organization",
      "Tier",
      "Seats",
      "Active Users (30d)",
      "Requests (30d)",
      "LLM Cost (30d)",
      "Bytes Total (30d)",
      "Hours Tracked (30d)",
      "Prompts Created",
      "Prompts Used (30d)",
      "MRR",
      "PTB",
      "BYOK",
      "Created At",
      "Stripe Customer ID"
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(","),
      ...sortedSegments.map(org => [
        `"${org.name.replace(/"/g, '""')}"`, // Escape quotes in names
        org.tier,
        org.seats,
        org.active_users_30d,
        org.requests_30d,
        org.llm_cost_30d.toFixed(2),
        org.bytes_total,
        org.hours_tracked,
        org.prompts_created,
        org.prompts_used_30d,
        org.mrr.toFixed(2),
        org.is_ptb ? "Yes" : "No",
        org.is_byok ? "Yes" : "No",
        org.created_at,
        `"${org.stripe_customer_id || ""}"`
      ].join(","))
    ];

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `pricing-analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                setIsRefreshing(true);
                bustCacheRef.current = true;
                try {
                  await refetch();
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isLoading || isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExportCSV}
              disabled={!segments || segments.length === 0}
            >
              <Download size={14} />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Table Container */}
      <div className="flex-1 overflow-auto px-6 pt-4">
            <div className="overflow-x-auto">
            <Table className="table-fixed min-w-[1690px]">
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead onClick={() => handleSort("name")} className="cursor-pointer w-[200px] min-w-[200px]">
                    <div className={`flex items-center gap-1 ${sortField === "name" ? "text-primary font-semibold" : ""}`}>
                      Organization
                      {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("tier")} className="cursor-pointer w-[100px] min-w-[100px]">
                    <div className={`flex items-center gap-1 ${sortField === "tier" ? "text-primary font-semibold" : ""}`}>
                      Tier
                      {getSortIcon("tier")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("seats")} className="cursor-pointer text-right w-[100px] min-w-[100px]">
                    <div className={`flex items-center gap-1 justify-end ${sortField === "seats" ? "text-primary font-semibold" : ""}`}>
                      Seats
                      {getSortIcon("seats")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("active_users_30d")} className="cursor-pointer text-right w-[120px] min-w-[120px]">
                    <div className={`flex items-center gap-1 justify-end ${sortField === "active_users_30d" ? "text-primary font-semibold" : ""}`}>
                      Active Users
                      {getSortIcon("active_users_30d")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("requests_30d")} className="cursor-pointer text-right w-[150px] min-w-[150px]">
                    <div className={`flex items-center gap-1 justify-end ${sortField === "requests_30d" ? "text-primary font-semibold" : ""}`}>
                      Requests (30d)
                      {getSortIcon("requests_30d")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("llm_cost_30d")} className="cursor-pointer text-right w-[150px] min-w-[150px]">
                    <div className={`flex items-center gap-1 justify-end ${sortField === "llm_cost_30d" ? "text-primary font-semibold" : ""}`}>
                      LLM Cost (30d)
                      {getSortIcon("llm_cost_30d")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("bytes_total")} className="cursor-pointer text-right w-[120px] min-w-[120px]">
                    <div className={`flex items-center gap-1 justify-end ${sortField === "bytes_total" ? "text-primary font-semibold" : ""}`}>
                      Bytes (30d)
                      {getSortIcon("bytes_total")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("hours_tracked")} className="cursor-pointer text-right w-[100px] min-w-[100px]">
                    <div className={`flex items-center gap-1 justify-end ${sortField === "hours_tracked" ? "text-primary font-semibold" : ""}`}>
                      Hours
                      {getSortIcon("hours_tracked")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("prompts_created")} className="cursor-pointer text-right w-[130px] min-w-[130px]">
                    <div className={`flex items-center gap-1 justify-end ${sortField === "prompts_created" ? "text-primary font-semibold" : ""}`}>
                      Prompts
                      {getSortIcon("prompts_created")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("prompts_used_30d")} className="cursor-pointer text-right w-[130px] min-w-[130px]">
                    <div className={`flex items-center gap-1 justify-end ${sortField === "prompts_used_30d" ? "text-primary font-semibold" : ""}`}>
                      Prompts Used
                      {getSortIcon("prompts_used_30d")}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("mrr")} className="cursor-pointer text-right w-[120px] min-w-[120px]">
                    <div className={`flex items-center gap-1 justify-end ${sortField === "mrr" ? "text-primary font-semibold" : ""}`}>
                      MRR
                      {getSortIcon("mrr")}
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-[80px] min-w-[80px]">PTB</TableHead>
                  <TableHead className="text-center w-[80px] min-w-[80px]">BYOK</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleSegments.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium w-[200px] min-w-[200px] max-w-[200px] truncate" title={org.name}>
                      {org.name}
                    </TableCell>
                    <TableCell className="w-[100px] min-w-[100px]">
                      <Badge className={getTierBadgeColor(org.tier)}>
                        {org.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right w-[100px] min-w-[100px]">
                      {formatNumber(org.seats)}
                    </TableCell>
                    <TableCell className="text-right w-[120px] min-w-[120px]">
                      {formatNumber(org.active_users_30d)}
                    </TableCell>
                    <TableCell className="text-right w-[150px] min-w-[150px]">
                      {formatNumber(org.requests_30d)}
                    </TableCell>
                    <TableCell className="text-right w-[150px] min-w-[150px]">
                      {formatCurrency(org.llm_cost_30d)}
                    </TableCell>
                    <TableCell className="text-right w-[120px] min-w-[120px]">
                      {formatBytes(org.bytes_total)}
                    </TableCell>
                    <TableCell className="text-right w-[100px] min-w-[100px]">
                      {formatNumber(org.hours_tracked)}
                    </TableCell>
                    <TableCell className="text-right w-[130px] min-w-[130px]">
                      {formatNumber(org.prompts_created)}
                    </TableCell>
                    <TableCell className="text-right w-[130px] min-w-[130px]">
                      {formatNumber(org.prompts_used_30d)}
                    </TableCell>
                    <TableCell className="text-right w-[120px] min-w-[120px]">
                      {formatCurrency(org.mrr)}
                    </TableCell>
                    <TableCell className="text-center w-[80px] min-w-[80px]">
                      {org.is_ptb ? "✓" : ""}
                    </TableCell>
                    <TableCell className="text-center w-[80px] min-w-[80px]">
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
