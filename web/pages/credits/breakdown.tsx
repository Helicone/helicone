import Header from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Muted } from "@/components/ui/typography";
import {
  useSpendBreakdown,
  type ModelSpend,
  type SpendTimeRange,
} from "@/services/hooks/useCredits";
import {
  ArrowLeft,
  ArrowUpDown,
  DollarSign,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import { ReactElement, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { NextPageWithLayout } from "../_app";

type SortField = "cost" | "requestCount" | "model" | "provider";
type SortDirection = "asc" | "desc";

const CreditsBreakdown: NextPageWithLayout<void> = () => {
  const [timeRange, setTimeRange] = useState<SpendTimeRange>("30d");
  const [sortField, setSortField] = useState<SortField>("cost");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data, isLoading, error, refetch } = useSpendBreakdown(timeRange);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedModels = data?.models
    ? [...data.models].sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        switch (sortField) {
          case "cost":
            return (a.cost - b.cost) * multiplier;
          case "requestCount":
            return (a.requestCount - b.requestCount) * multiplier;
          case "model":
            return a.model.localeCompare(b.model) * multiplier;
          case "provider":
            return a.provider.localeCompare(b.provider) * multiplier;
          default:
            return 0;
        }
      })
    : [];

  const formatCost = (cost: number) => {
    if (cost === 0) return "$0.00";
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    if (cost < 1) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`;
    }
    return tokens.toLocaleString();
  };

  const formatPricing = (pricing: { inputPer1M: number; outputPer1M: number } | null) => {
    if (!pricing) return "-";
    const formatRate = (rate: number) => {
      if (rate < 0.01) return rate.toFixed(4);
      if (rate < 1) return rate.toFixed(2);
      return rate.toFixed(2);
    };
    return `$${formatRate(pricing.inputPer1M)} / $${formatRate(pricing.outputPer1M)}`;
  };

  const getTimeRangeLabel = (range: SpendTimeRange) => {
    switch (range) {
      case "7d":
        return "Last 7 days";
      case "30d":
        return "Last 30 days";
      case "90d":
        return "Last 90 days";
      case "all":
        return "All time";
    }
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-foreground"
    >
      {children}
      <ArrowUpDown
        size={14}
        className={sortField === field ? "text-foreground" : "opacity-50"}
      />
    </button>
  );

  return (
    <div className="flex h-screen w-full flex-col">
      <Header
        title="Spend Breakdown"
        rightActions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 justify-center">
        <div className="flex w-full max-w-7xl flex-col">
          <div className="flex-1 overflow-auto p-6">
            <div className="flex flex-col gap-6">
              {/* Back link */}
              <Link
                href="/credits"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={14} />
                Back to Credits
              </Link>

              {/* Summary Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} className="text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">
                      Total Spend ({getTimeRangeLabel(timeRange)})
                    </CardTitle>
                  </div>
                  <Select
                    value={timeRange}
                    onValueChange={(value) =>
                      setTimeRange(value as SpendTimeRange)
                    }
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-3xl font-bold">
                    {isLoading ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : error ? (
                      <span className="text-destructive">
                        Error loading data
                      </span>
                    ) : (
                      formatCost(data?.totalCost ?? 0)
                    )}
                  </div>
                  {data?.timeRange && (
                    <Muted className="mt-1 text-xs">
                      {new Date(data.timeRange.start).toLocaleDateString()} -{" "}
                      {new Date(data.timeRange.end).toLocaleDateString()}
                    </Muted>
                  )}
                </CardContent>
              </Card>

              {/* Breakdown Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Spend by Model</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-8 text-center">
                      <Muted>Loading breakdown...</Muted>
                    </div>
                  ) : error ? (
                    <div className="py-8 text-center">
                      <Muted>Error loading breakdown</Muted>
                    </div>
                  ) : sortedModels.length === 0 ? (
                    <div className="py-8 text-center">
                      <Muted>No spend data for this time range</Muted>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <SortButton field="model">Model</SortButton>
                          </TableHead>
                          <TableHead>
                            <SortButton field="provider">Provider</SortButton>
                          </TableHead>
                          <TableHead className="text-right">
                            <SortButton field="requestCount">
                              Requests
                            </SortButton>
                          </TableHead>
                          <TableHead className="text-right">Tokens</TableHead>
                          <TableHead className="text-right">
                            Pricing ($/1M)
                          </TableHead>
                          <TableHead className="text-right">
                            <SortButton field="cost">Cost</SortButton>
                          </TableHead>
                          <TableHead className="text-right">% Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedModels.map((model: ModelSpend, index: number) => {
                          const percentage =
                            data?.totalCost && data.totalCost > 0
                              ? (model.cost / data.totalCost) * 100
                              : 0;
                          return (
                            <TableRow key={`${model.model}-${model.provider}-${index}`}>
                              <TableCell className="font-medium">
                                {model.model || "(unknown)"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {model.provider || "(unknown)"}
                              </TableCell>
                              <TableCell className="text-right">
                                {model.requestCount.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                <div className="flex flex-col items-end">
                                  <span>
                                    {formatTokens(model.promptTokens)} in
                                  </span>
                                  <span>
                                    {formatTokens(model.completionTokens)} out
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">
                                {formatPricing(model.pricing)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCost(model.cost)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {percentage.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

CreditsBreakdown.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default CreditsBreakdown;
