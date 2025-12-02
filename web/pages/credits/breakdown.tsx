import Header from "@/components/shared/Header";
import { Button } from "@/components/ui/button";
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
import {
  useSpendBreakdown,
  type ModelSpend,
  type SpendTimeRange,
} from "@/services/hooks/useCredits";
import { ArrowUpDown, RefreshCcw } from "lucide-react";
import { ReactElement, useMemo, useState } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { NextPageWithLayout } from "../_app";

type SortField =
  | "total"
  | "model"
  | "provider"
  | "inputTokens"
  | "outputTokens";
type SortDirection = "asc" | "desc";

const CreditsBreakdown: NextPageWithLayout<void> = () => {
  const [timeRange, setTimeRange] = useState<SpendTimeRange>("30d");
  const [sortField, setSortField] = useState<SortField>("total");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data, isLoading, error, refetch } = useSpendBreakdown(timeRange);

  const sortedModels = useMemo(() => {
    if (!data?.models) return [];
    const multiplier = sortDirection === "asc" ? 1 : -1;
    return [...data.models].sort((a, b) => {
      switch (sortField) {
        case "total":
          return (a.total - b.total) * multiplier;
        case "model":
          return a.model.localeCompare(b.model) * multiplier;
        case "provider":
          return a.provider.localeCompare(b.provider) * multiplier;
        case "inputTokens":
          return (a.promptTokens - b.promptTokens) * multiplier;
        case "outputTokens":
          return (a.completionTokens - b.completionTokens) * multiplier;
        default:
          return 0;
      }
    });
  }, [data?.models, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(2)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}K`;
    }
    return tokens.toLocaleString();
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "-";
    if (price < 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const formatCost = (cost: number) => {
    if (cost === 0) return "$0.00";
    if (cost < 0.01) return `$${cost.toFixed(6)}`;
    if (cost < 1) return `$${cost.toFixed(4)}`;
    return cost.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDiscount = (percent: number) => {
    if (percent === 0) return "-";
    return `-${percent}%`;
  };

  const SortableHeader = ({
    field,
    children,
    align = "left",
  }: {
    field: SortField;
    children: React.ReactNode;
    align?: "left" | "right";
  }) => (
    <TableHead className={align === "right" ? "text-right" : ""}>
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1 hover:text-foreground ${
          align === "right" ? "ml-auto" : ""
        }`}
      >
        {children}
        <ArrowUpDown
          size={14}
          className={sortField === field ? "text-foreground" : "opacity-50"}
        />
      </button>
    </TableHead>
  );

  return (
    <main className="flex h-screen w-full flex-col">
      <Header
        title="Spend Breakdown"
        leftActions={
          <div className="flex items-center gap-2">
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as SpendTimeRange)}
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
          </div>
        }
        rightActions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-mono text-lg font-semibold">
                {isLoading
                  ? "..."
                  : error
                    ? "-"
                    : formatCost(data?.totalCost ?? 0)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCcw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-destructive">Error loading data</span>
          </div>
        ) : sortedModels.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground">
              No spend data for this time range
            </span>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow className="border-b">
                <SortableHeader field="model">Model</SortableHeader>
                <SortableHeader field="provider">Provider</SortableHeader>
                <SortableHeader field="inputTokens" align="right">
                  Input Tokens
                </SortableHeader>
                <SortableHeader field="outputTokens" align="right">
                  Output Tokens
                </SortableHeader>
                <TableHead className="text-right">Input $/1M</TableHead>
                <TableHead className="text-right">Output $/1M</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <SortableHeader field="total" align="right">
                  Total
                </SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModels.map((item: ModelSpend, index: number) => (
                <TableRow key={`${item.model}-${item.provider}-${index}`}>
                  <TableCell className="font-medium">
                    {item.model || "(unknown)"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.provider || "(unknown)"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatTokens(item.promptTokens)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatTokens(item.completionTokens)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatPrice(item.pricing?.inputPer1M)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatPrice(item.pricing?.outputPer1M)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatCost(item.subtotal)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {formatDiscount(item.discountPercent)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {formatCost(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </main>
  );
};

CreditsBreakdown.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default CreditsBreakdown;
