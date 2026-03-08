import { useState, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/org/organizationContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Users,
  Building2,
  RotateCcw,
  Plus,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  StopCircle,
  Play,
  Calendar,
  ClipboardCheck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  History,
  Wrench,
  Link,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { H2, P, Small, Muted } from "@/components/ui/typography";
import { useDebounce } from "@/lib/hooks/useDebounce";

const LEGACY_TIERS = [
  "pro-20240913",
  "pro-20250202",
  "growth",
  "team-20250130",
];
const PAGE_SIZE = 50;

type MigrationStatus = "idle" | "migrating" | "success" | "error";
type TabType = "pending" | "completed";

interface MigrationState {
  [orgId: string]: {
    status: MigrationStatus;
    error?: string;
  };
}

interface OrgDetails {
  id: string;
  name: string;
  tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id?: string | null;
  subscription_status: string | null;
  stripe_status?: string | null;
  owner_email: string | null;
  created_at?: string;
  member_count?: number;
}

interface AuditMismatch {
  subscriptionId: string;
  customerId: string;
  customerEmail: string | null;
  stripeStatus: string;
  orgId: string | null;
  orgName: string | null;
  orgTier: string | null;
  orgSubscriptionStatus: string | null;
  orgHasCustomerId: boolean;
  orgHasSubscriptionId: boolean;
  issue: string;
  userOrgs: Array<{ id: string; name: string; tier: string }>;
  isInAuthUsers: boolean;
}

interface AuditResult {
  mismatches: AuditMismatch[];
  summary: {
    totalActiveSubscriptions: number;
    totalMismatches: number;
    filteredOutEuUsers: number;
    byIssue: Record<string, number>;
  };
  timestamp?: number;
}

type AuditSortKey = "subscriptionId" | "customerEmail" | "stripeStatus" | "orgName" | "issue";
type SortDirection = "asc" | "desc";

const getTierBadgeColor = (tier: string) => {
  if (tier.includes("team")) return "bg-purple-100 text-purple-800";
  if (tier.includes("pro")) return "bg-blue-100 text-blue-800";
  if (tier === "growth") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

const getTargetTier = (currentTier: string) => {
  if (currentTier === "team-20250130") return "team-20251210";
  return "pro-20251210";
};

const getStripeStatusBadge = (status: string | null | undefined) => {
  if (!status) return { color: "bg-gray-100 text-gray-800", label: "Unknown" };
  switch (status) {
    case "active":
      return { color: "bg-green-100 text-green-800", label: "Active" };
    case "canceled":
      return { color: "bg-red-100 text-red-800", label: "Cancelled" };
    case "past_due":
      return { color: "bg-yellow-100 text-yellow-800", label: "Past Due" };
    case "unpaid":
      return { color: "bg-orange-100 text-orange-800", label: "Unpaid" };
    case "not_found":
      return { color: "bg-red-100 text-red-800", label: "Not Found" };
    default:
      return { color: "bg-gray-100 text-gray-800", label: status };
  }
};

const isCancelledOrMissing = (status: string | null | undefined) => {
  return status === "canceled" || status === "not_found" || status === "incomplete_expired";
};

function buildSubscriptionIdMap(
  orgs: Array<{ id: string; stripe_subscription_id?: string | null }> | undefined
): Map<string, string | null | undefined> {
  const subMap = new Map<string, string | null | undefined>();
  orgs?.forEach((org) => subMap.set(org.id, org.stripe_subscription_id));
  return subMap;
}

interface BatchActionBarProps {
  tab: TabType;
  selectedIds: Set<string>;
  batchProcessing: {
    isRunning: boolean;
    currentIndex: number;
    totalCount: number;
    migrationType: "instant" | "scheduled";
    tab: TabType;
    results: { orgId: string; success: boolean; error?: string }[];
  } | null;
  openStripeOnBatch: boolean;
  setOpenStripeOnBatch: (value: boolean) => void;
  onStop: () => void;
  onClear: () => void;
  onRunBatch: (migrationType: "instant" | "scheduled") => void;
  isReapply?: boolean;
}

function BatchActionBar({
  tab,
  selectedIds,
  batchProcessing,
  openStripeOnBatch,
  setOpenStripeOnBatch,
  onStop,
  onClear,
  onRunBatch,
  isReapply = false,
}: BatchActionBarProps) {
  const isThisTab = batchProcessing?.tab === tab;
  const isProcessing = isThisTab && batchProcessing?.isRunning;
  const hasFinished = isThisTab && !batchProcessing?.isRunning;

  if (selectedIds.size === 0 && !isThisTab) return null;

  return (
    <div className="mb-4 rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {isThisTab && batchProcessing ? (
              <>
                Processing {batchProcessing.currentIndex + 1} of{" "}
                {batchProcessing.totalCount}
                {!batchProcessing.isRunning && " (stopped)"}
              </>
            ) : (
              <>{selectedIds.size} selected</>
            )}
          </span>
          {isThisTab && batchProcessing && (
            <div className="flex items-center gap-2">
              <Progress
                value={
                  ((batchProcessing.currentIndex +
                    (batchProcessing.isRunning ? 0 : 1)) /
                    batchProcessing.totalCount) *
                  100
                }
                className="w-32"
              />
              <span className="text-xs text-muted-foreground">
                {batchProcessing.results.filter((r) => r.success).length}{" "}
                success,{" "}
                {batchProcessing.results.filter((r) => !r.success).length}{" "}
                failed
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <Button variant="destructive" size="sm" onClick={onStop}>
              <StopCircle size={14} className="mr-1" />
              Stop
            </Button>
          ) : hasFinished ? (
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear
            </Button>
          ) : (
            <>
              <div className="mr-2 flex items-center gap-2">
                <Checkbox
                  id={`openStripe${tab}`}
                  checked={openStripeOnBatch}
                  onCheckedChange={(checked) =>
                    setOpenStripeOnBatch(checked === true)
                  }
                />
                <label
                  htmlFor={`openStripe${tab}`}
                  className="cursor-pointer text-xs text-muted-foreground"
                >
                  Open Stripe
                </label>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => onRunBatch("instant")}
                disabled={selectedIds.size === 0}
              >
                <Play size={14} className="mr-1" />
                {isReapply ? "Reapply Now" : "Now"} ({selectedIds.size})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRunBatch("scheduled")}
                disabled={selectedIds.size === 0}
              >
                <Calendar size={14} className="mr-1" />
                Schedule ({selectedIds.size})
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPricingMigration() {
  const org = useOrg();
  const queryClient = useQueryClient();
  const [migrationStates, setMigrationStates] = useState<MigrationState>({});
  const [confirmMigrateOrg, setConfirmMigrateOrg] = useState<{
    id: string;
    name: string;
    tier: string;
    migrationType: "instant" | "scheduled";
    targetTier?: "pro" | "team";
  } | null>(null);
  const [confirmReapplyOrg, setConfirmReapplyOrg] = useState<{
    id: string;
    name: string;
    tier: string;
    migrationType: "instant" | "scheduled";
    targetTier?: "pro" | "team";
  } | null>(null);
  const [confirmSwitchToFreeOrg, setConfirmSwitchToFreeOrg] = useState<{
    id: string;
    name: string;
    tier: string;
  } | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<OrgDetails | null>(null);
  const [usageType, setUsageType] = useState<"requests" | "storage_gb">(
    "requests",
  );
  const [usageQuantity, setUsageQuantity] = useState("");

  // Batch selection state
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedCompletedIds, setSelectedCompletedIds] = useState<Set<string>>(
    new Set()
  );

  // Batch processing state
  const [batchProcessing, setBatchProcessing] = useState<{
    isRunning: boolean;
    currentIndex: number;
    totalCount: number;
    migrationType: "instant" | "scheduled";
    tab: TabType;
    orgIds: string[];
    results: { orgId: string; success: boolean; error?: string }[];
  } | null>(null);
  const stopBatchRef = useRef(false);
  const [openStripeOnBatch, setOpenStripeOnBatch] = useState(false);

  // Pagination & filter state
  const [pendingPage, setPendingPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [stripeStatusFilter, setStripeStatusFilter] = useState<string>("all");

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Audit state
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [showAuditResults, setShowAuditResults] = useState(false);
  const [auditSortKey, setAuditSortKey] = useState<AuditSortKey>("issue");
  const [auditSortDir, setAuditSortDir] = useState<SortDirection>("asc");

  // Load cached audit from localStorage on mount
  const loadCachedAudit = useCallback(() => {
    try {
      const cached = localStorage.getItem("admin-audit-result");
      if (cached) {
        const parsed = JSON.parse(cached) as AuditResult;
        setAuditResult(parsed);
        return parsed;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, []);

  // Check if there's a cached audit
  const hasCachedAudit = useMemo(() => {
    try {
      return !!localStorage.getItem("admin-audit-result");
    } catch {
      return false;
    }
  }, [showAuditResults]); // Re-check when panel closes

  // Sort audit mismatches
  const sortedMismatches = useMemo(() => {
    if (!auditResult?.mismatches) return [];
    return [...auditResult.mismatches].sort((a, b) => {
      let aVal: string | null = null;
      let bVal: string | null = null;

      switch (auditSortKey) {
        case "subscriptionId":
          aVal = a.subscriptionId;
          bVal = b.subscriptionId;
          break;
        case "customerEmail":
          aVal = a.customerEmail;
          bVal = b.customerEmail;
          break;
        case "stripeStatus":
          aVal = a.stripeStatus;
          bVal = b.stripeStatus;
          break;
        case "orgName":
          aVal = a.orgName;
          bVal = b.orgName;
          break;
        case "issue":
          aVal = a.issue;
          bVal = b.issue;
          break;
      }

      // Handle nulls
      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return auditSortDir === "asc" ? 1 : -1;
      if (bVal === null) return auditSortDir === "asc" ? -1 : 1;

      const cmp = aVal.localeCompare(bVal);
      return auditSortDir === "asc" ? cmp : -cmp;
    });
  }, [auditResult?.mismatches, auditSortKey, auditSortDir]);

  const handleAuditSort = (key: AuditSortKey) => {
    if (auditSortKey === key) {
      setAuditSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setAuditSortKey(key);
      setAuditSortDir("asc");
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPendingPage(0); // Reset to first page on search
  };

  const handleTierFilterChange = (value: string) => {
    setTierFilter(value);
    setPendingPage(0); // Reset to first page on filter change
  };

  const handleStripeStatusFilterChange = (value: string) => {
    setStripeStatusFilter(value);
    setPendingPage(0); // Reset to first page on filter change
  };

  // Fetch pending migrations with pagination, search, and tier filter
  const pendingQuery = useQuery({
    queryKey: [
      "admin",
      "pricing-migration",
      "pending",
      pendingPage,
      debouncedSearch,
      tierFilter,
    ],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        "/v1/admin/pricing-migration/pending",
        {
          body: {
            limit: PAGE_SIZE,
            offset: pendingPage * PAGE_SIZE,
            search: debouncedSearch || undefined,
            tierFilter: tierFilter === "all" ? undefined : [tierFilter],
          },
        },
      );
      if (error) throw new Error(String(error));
      return data;
    },
  });

  // Filter pending organizations by stripe status (frontend filter)
  const filteredPendingOrgs = useMemo(() => {
    if (!pendingQuery.data?.organizations) return [];
    if (stripeStatusFilter === "all") return pendingQuery.data.organizations;
    return pendingQuery.data.organizations.filter(
      (org) => org.stripe_status === stripeStatusFilter
    );
  }, [pendingQuery.data?.organizations, stripeStatusFilter]);

  // Fetch completed migrations
  const completedQuery = useQuery({
    queryKey: ["admin", "pricing-migration", "completed"],
    queryFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.GET(
        "/v1/admin/pricing-migration/completed",
      );
      if (error) throw new Error(String(error));
      return data;
    },
  });

  // Migrate Instant mutation - updates immediately + backfills usage
  const migrateInstantMutation = useMutation({
    mutationFn: async ({
      orgId,
      targetTier,
    }: {
      orgId: string;
      targetTier?: "pro" | "team";
    }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        "/v1/admin/pricing-migration/migrate-instant/{orgId}",
        {
          params: { path: { orgId } },
          body: { targetTier },
        },
      );
      if (error) throw new Error(String(error));
      // Check for business logic error in Result type
      if (data && "error" in data && data.error) {
        throw new Error(String(data.error));
      }
      return data;
    },
    onMutate: ({ orgId }) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: { status: "migrating" },
      }));
    },
    onSuccess: (_, { orgId }) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: { status: "success" },
      }));
      queryClient.invalidateQueries({
        queryKey: ["admin", "pricing-migration"],
      });
    },
    onError: (error, { orgId }) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: {
          status: "error",
          error: error instanceof Error ? error.message : "Migration failed",
        },
      }));
    },
  });

  // Migrate Scheduled mutation - schedules for next billing period
  const migrateScheduledMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        "/v1/admin/pricing-migration/migrate-scheduled/{orgId}",
        {
          params: { path: { orgId } },
        },
      );
      if (error) throw new Error(String(error));
      // Check for business logic error in Result type
      if (data && "error" in data && data.error) {
        throw new Error(String(data.error));
      }
      return data;
    },
    onMutate: (orgId) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: { status: "migrating" },
      }));
    },
    onSuccess: (_, orgId) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: { status: "success" },
      }));
      queryClient.invalidateQueries({
        queryKey: ["admin", "pricing-migration"],
      });
    },
    onError: (error, orgId) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: {
          status: "error",
          error: error instanceof Error ? error.message : "Schedule failed",
        },
      }));
    },
  });

  // Add usage mutation
  const addUsageMutation = useMutation({
    mutationFn: async ({
      orgId,
      usageType,
      quantity,
    }: {
      orgId: string;
      usageType: "requests" | "storage_gb";
      quantity: number;
    }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        "/v1/admin/pricing-migration/add-usage/{orgId}",
        {
          params: { path: { orgId } },
          body: { usageType, quantity },
        },
      );
      if (error) {
        const errorMsg =
          typeof error === "object" && error !== null
            ? JSON.stringify(error)
            : String(error);
        throw new Error(errorMsg);
      }
      // Check for business logic error in Result type
      if (data && "error" in data && data.error) {
        throw new Error(String(data.error));
      }
      return data;
    },
    onSuccess: () => {
      setUsageQuantity("");
    },
  });

  // Switch to free mutation
  const switchToFreeMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        "/v1/admin/pricing-migration/switch-to-free/{orgId}",
        {
          params: { path: { orgId } },
        },
      );
      if (error) throw new Error(String(error));
      // Check for business logic error in Result type
      if (data && "error" in data && data.error) {
        throw new Error(String(data.error));
      }
      return data;
    },
    onMutate: (orgId) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: { status: "migrating" },
      }));
    },
    onSuccess: (_, orgId) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: { status: "success" },
      }));
      queryClient.invalidateQueries({
        queryKey: ["admin", "pricing-migration"],
      });
    },
    onError: (error, orgId) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: {
          status: "error",
          error:
            error instanceof Error ? error.message : "Switch to free failed",
        },
      }));
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        "/v1/admin/pricing-migration/cancel-subscription/{orgId}" as any,
        {
          params: { path: { orgId } },
        },
      );
      if (error) throw new Error(String(error));
      // Check for business logic error in Result type
      if (data && "error" in data && data.error) {
        throw new Error(String(data.error));
      }
      return data;
    },
    onMutate: (orgId) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: { status: "migrating" },
      }));
    },
    onSuccess: (_, orgId) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: { status: "success" },
      }));
      queryClient.invalidateQueries({
        queryKey: ["admin", "pricing-migration"],
      });
    },
    onError: (error, orgId) => {
      setMigrationStates((prev) => ({
        ...prev,
        [orgId]: {
          status: "error",
          error:
            error instanceof Error ? error.message : "Cancel subscription failed",
        },
      }));
    },
  });

  // Audit subscriptions mutation
  const auditMutation = useMutation({
    mutationFn: async () => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        "/v1/admin/pricing-migration/audit" as any,
      );
      if (error) {
        console.error("Audit error:", error);
        throw new Error(typeof error === "object" ? JSON.stringify(error) : String(error));
      }
      return data as AuditResult;
    },
    onSuccess: (data) => {
      const resultWithTimestamp = { ...data, timestamp: Date.now() };
      setAuditResult(resultWithTimestamp);
      // Cache to localStorage
      try {
        localStorage.setItem("admin-audit-result", JSON.stringify(resultWithTimestamp));
      } catch {
        // Ignore storage errors
      }
      setShowAuditResults(true);
    },
    onError: (error) => {
      console.error("Audit mutation error:", error);
      alert(`Audit failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Fix tier mutation
  const fixTierMutation = useMutation({
    mutationFn: async ({
      orgId,
      subscriptionId,
    }: {
      orgId: string;
      subscriptionId: string;
    }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        "/v1/admin/pricing-migration/fix-tier/{orgId}" as any,
        {
          params: { path: { orgId } },
          body: { subscriptionId },
        },
      );
      if (error) throw new Error(String(error));
      if (data && "error" in data && data.error) {
        throw new Error(String(data.error));
      }
      return data;
    },
    onSuccess: () => {
      // Re-run audit to refresh data
      auditMutation.mutate();
    },
    onError: (error) => {
      alert(`Fix tier failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  // Fix metadata mutation
  const fixMetadataMutation = useMutation({
    mutationFn: async ({
      orgId,
      customerId,
      subscriptionId,
    }: {
      orgId: string;
      customerId: string;
      subscriptionId: string;
    }) => {
      const jawn = getJawnClient(org?.currentOrg?.id);
      const { data, error } = await jawn.POST(
        "/v1/admin/pricing-migration/fix-metadata/{orgId}" as any,
        {
          params: { path: { orgId } },
          body: { customerId, subscriptionId },
        },
      );
      if (error) throw new Error(String(error));
      if (data && "error" in data && data.error) {
        throw new Error(String(data.error));
      }
      return data;
    },
    onSuccess: () => {
      // Re-run audit to refresh data
      auditMutation.mutate();
    },
    onError: (error) => {
      alert(`Fix metadata failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    },
  });

  const handleMigrate = (
    orgId: string,
    migrationType: "instant" | "scheduled",
    targetTier?: "pro" | "team",
  ) => {
    setConfirmMigrateOrg(null);
    if (migrationType === "instant") {
      migrateInstantMutation.mutate({ orgId, targetTier });
    } else {
      migrateScheduledMutation.mutate(orgId);
    }
  };

  const handleReapply = (
    orgId: string,
    migrationType: "instant" | "scheduled",
    targetTier?: "pro" | "team",
  ) => {
    setConfirmReapplyOrg(null);
    if (migrationType === "instant") {
      migrateInstantMutation.mutate({ orgId, targetTier });
    } else {
      migrateScheduledMutation.mutate(orgId);
    }
  };

  const handleSwitchToFree = (orgId: string) => {
    setConfirmSwitchToFreeOrg(null);
    switchToFreeMutation.mutate(orgId);
  };

  const handleAddUsage = () => {
    if (!selectedOrg || !usageQuantity) return;
    addUsageMutation.mutate({
      orgId: selectedOrg.id,
      usageType,
      quantity: parseInt(usageQuantity, 10),
    });
  };

  const getStatusIcon = (orgId: string) => {
    const state = migrationStates[orgId];
    if (!state || state.status === "idle") return null;
    if (state.status === "migrating")
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    if (state.status === "success")
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (state.status === "error")
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    return null;
  };

  const openStripeCustomer = (customerId: string) => {
    window.open(
      `https://dashboard.stripe.com/customers/${customerId}`,
      "_blank",
    );
  };

  const openStripeSubscription = (subscriptionId: string) => {
    window.open(
      `https://dashboard.stripe.com/subscriptions/${subscriptionId}`,
      "_blank",
    );
  };

  // Batch selection handlers
  const togglePendingSelection = (orgId: string) => {
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  const toggleCompletedSelection = (orgId: string) => {
    setSelectedCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  const toggleAllPending = (orgs: OrgDetails[]) => {
    const allSelected = orgs.every((org) => selectedPendingIds.has(org.id));
    if (allSelected) {
      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        orgs.forEach((org) => next.delete(org.id));
        return next;
      });
    } else {
      setSelectedPendingIds((prev) => {
        const next = new Set(prev);
        orgs.forEach((org) => next.add(org.id));
        return next;
      });
    }
  };

  const toggleAllCompleted = (orgs: OrgDetails[]) => {
    const allSelected = orgs.every((org) => selectedCompletedIds.has(org.id));
    if (allSelected) {
      setSelectedCompletedIds((prev) => {
        const next = new Set(prev);
        orgs.forEach((org) => next.delete(org.id));
        return next;
      });
    } else {
      setSelectedCompletedIds((prev) => {
        const next = new Set(prev);
        orgs.forEach((org) => next.add(org.id));
        return next;
      });
    }
  };

  // Batch migration function - processes orgs one at a time
  const runBatchMigration = useCallback(
    async (
      orgIds: string[],
      migrationType: "instant" | "scheduled",
      tab: "pending" | "completed",
      openStripe: boolean,
      subscriptionIdMap: Map<string, string | null | undefined>
    ) => {
      if (orgIds.length === 0) return;

      stopBatchRef.current = false;
      setBatchProcessing({
        isRunning: true,
        currentIndex: 0,
        totalCount: orgIds.length,
        migrationType,
        tab,
        orgIds,
        results: [],
      });

      const jawn = getJawnClient(org?.currentOrg?.id);
      const results: { orgId: string; success: boolean; error?: string }[] = [];

      for (let i = 0; i < orgIds.length; i++) {
        if (stopBatchRef.current) {
          break;
        }

        const orgId = orgIds[i];
        setBatchProcessing((prev) =>
          prev ? { ...prev, currentIndex: i, results } : null
        );

        // Open Stripe subscription page if enabled
        if (openStripe) {
          const subscriptionId = subscriptionIdMap.get(orgId);
          if (subscriptionId) {
            window.open(
              `https://dashboard.stripe.com/subscriptions/${subscriptionId}`,
              "_blank"
            );
          }
        }

        // Update individual status
        setMigrationStates((prev) => ({
          ...prev,
          [orgId]: { status: "migrating" },
        }));

        try {
          const endpoint =
            migrationType === "instant"
              ? "/v1/admin/pricing-migration/migrate-instant/{orgId}"
              : "/v1/admin/pricing-migration/migrate-scheduled/{orgId}";

          const { data, error } = await jawn.POST(endpoint as any, {
            params: { path: { orgId } },
            body: migrationType === "instant" ? {} : undefined,
          });

          // Check for HTTP-level error
          if (error) {
            throw new Error(
              typeof error === "object" ? JSON.stringify(error) : String(error)
            );
          }

          // Check for business logic error in Result type
          if (data && "error" in data && data.error) {
            throw new Error(String(data.error));
          }

          results.push({ orgId, success: true });
          setMigrationStates((prev) => ({
            ...prev,
            [orgId]: { status: "success" },
          }));

          // Remove from selection on success
          if (tab === "pending") {
            setSelectedPendingIds((prev) => {
              const next = new Set(prev);
              next.delete(orgId);
              return next;
            });
          } else {
            setSelectedCompletedIds((prev) => {
              const next = new Set(prev);
              next.delete(orgId);
              return next;
            });
          }
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : "Migration failed";
          results.push({ orgId, success: false, error: errorMsg });
          setMigrationStates((prev) => ({
            ...prev,
            [orgId]: { status: "error", error: errorMsg },
          }));
        }

        // Small delay between migrations to be gentle on APIs
        if (i < orgIds.length - 1 && !stopBatchRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      // Final update
      setBatchProcessing((prev) =>
        prev ? { ...prev, isRunning: false, results } : null
      );

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: ["admin", "pricing-migration"],
      });
    },
    [org?.currentOrg?.id, queryClient]
  );

  const stopBatchMigration = () => {
    stopBatchRef.current = true;
  };

  const clearBatchResults = () => {
    setBatchProcessing(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <H2>Pricing Migration</H2>
          <Muted>
            Migrate organizations from legacy pricing to the new 2025-12-10
            pricing model
          </Muted>
        </div>
        <div className="flex items-center gap-2">
          {hasCachedAudit && (
            <Button
              variant="ghost"
              onClick={() => {
                loadCachedAudit();
                setShowAuditResults(true);
              }}
            >
              <History className="mr-2 h-4 w-4" />
              View Last Audit
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => auditMutation.mutate()}
            disabled={auditMutation.isPending}
          >
            {auditMutation.isPending ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ClipboardCheck className="mr-2 h-4 w-4" />
            )}
            {auditMutation.isPending ? "Auditing..." : "Run Audit"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Migrations</CardDescription>
            <CardTitle className="text-3xl">
              {pendingQuery.data?.summary?.total ?? "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pendingQuery.data?.summary?.byTier &&
                Object.entries(pendingQuery.data.summary.byTier).map(
                  ([tier, count]) => (
                    <Badge
                      key={tier}
                      variant="secondary"
                      className={getTierBadgeColor(tier)}
                    >
                      {tier}: {count}
                    </Badge>
                  ),
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Migrations</CardDescription>
            <CardTitle className="text-3xl">
              {completedQuery.data?.summary?.total ?? "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {completedQuery.data?.summary?.byTier &&
                Object.entries(completedQuery.data.summary.byTier).map(
                  ([tier, count]) => (
                    <Badge
                      key={tier}
                      variant="secondary"
                      className={getTierBadgeColor(tier)}
                    >
                      {tier}: {count}
                    </Badge>
                  ),
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Migration Progress</CardDescription>
            <CardTitle className="text-3xl">
              {pendingQuery.data && completedQuery.data
                ? `${Math.round(
                    (completedQuery.data.summary.total /
                      (pendingQuery.data.summary.total +
                        completedQuery.data.summary.total)) *
                      100,
                  )}%`
                : "-"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-green-500 transition-all"
                style={{
                  width:
                    pendingQuery.data && completedQuery.data
                      ? `${
                          (completedQuery.data.summary.total /
                            (pendingQuery.data.summary.total +
                              completedQuery.data.summary.total)) *
                          100
                        }%`
                      : "0%",
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Pending/Completed */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingQuery.data?.summary?.total ?? 0})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedQuery.data?.summary?.total ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div>
                  <CardTitle>Organizations Pending Migration</CardTitle>
                  <CardDescription>
                    These organizations are on legacy pricing and need to be
                    migrated
                  </CardDescription>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, ID, or email..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={tierFilter}
                    onValueChange={handleTierFilterChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      {LEGACY_TIERS.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={stripeStatusFilter}
                    onValueChange={handleStripeStatusFilterChange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Stripe status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trialing">Trialing</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="incomplete">Incomplete</SelectItem>
                      <SelectItem value="incomplete_expired">Incomplete Expired</SelectItem>
                      <SelectItem value="not_found">Not Found</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredPendingOrgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="mb-2 h-12 w-12" />
                  <P>All organizations have been migrated!</P>
                </div>
              ) : (
                <>
                  <BatchActionBar
                    tab="pending"
                    selectedIds={selectedPendingIds}
                    batchProcessing={batchProcessing}
                    openStripeOnBatch={openStripeOnBatch}
                    setOpenStripeOnBatch={setOpenStripeOnBatch}
                    onStop={stopBatchMigration}
                    onClear={clearBatchResults}
                    onRunBatch={(migrationType) => {
                      runBatchMigration(
                        Array.from(selectedPendingIds),
                        migrationType,
                        "pending",
                        openStripeOnBatch,
                        buildSubscriptionIdMap(filteredPendingOrgs)
                      );
                    }}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={
                              filteredPendingOrgs.length > 0 &&
                              filteredPendingOrgs.every((org) =>
                                selectedPendingIds.has(org.id)
                              )
                            }
                            onCheckedChange={() =>
                              toggleAllPending(
                                filteredPendingOrgs
                              )
                            }
                            disabled={batchProcessing?.isRunning}
                          />
                        </TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Current Tier</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Trial</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Next Invoice</TableHead>
                        <TableHead>Stripe Status</TableHead>
                        <TableHead>Stripe</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingOrgs.map((pendingOrg) => {
                        const stripeStatus = getStripeStatusBadge(
                          pendingOrg.stripe_status,
                        );
                        const isCancelled = isCancelledOrMissing(
                          pendingOrg.stripe_status,
                        );
                        return (
                          <TableRow
                            key={pendingOrg.id}
                            className={`cursor-pointer hover:bg-muted/50 ${
                              isCancelled ? "bg-red-50 dark:bg-red-950/20" : ""
                            } ${
                              selectedPendingIds.has(pendingOrg.id)
                                ? "bg-primary/5"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedOrg(pendingOrg as OrgDetails)
                            }
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedPendingIds.has(pendingOrg.id)}
                                onCheckedChange={() =>
                                  togglePendingSelection(pendingOrg.id)
                                }
                                disabled={batchProcessing?.isRunning}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">
                                    {pendingOrg.name}
                                  </div>
                                  <a
                                    href={`/organizations/${pendingOrg.id}`}
                                    className="text-xs text-muted-foreground hover:underline"
                                  >
                                    {pendingOrg.id}
                                  </a>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Small>{pendingOrg.owner_email ?? "-"}</Small>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={getTierBadgeColor(pendingOrg.tier)}
                              >
                                {pendingOrg.tier}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Small className="text-muted-foreground">
                                {pendingOrg.created_at
                                  ? new Date(pendingOrg.created_at).toLocaleDateString()
                                  : "-"}
                              </Small>
                            </TableCell>
                            <TableCell>
                              {stripeStatus.label === "Trialing" || pendingOrg.trial_end ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-100 text-amber-800"
                                >
                                  Trial
                                  {pendingOrg.trial_end && (
                                    <span className="ml-1">
                                      → {new Date(pendingOrg.trial_end * 1000).toLocaleDateString()}
                                    </span>
                                  )}
                                </Badge>
                              ) : (
                                <Small className="text-muted-foreground">-</Small>
                              )}
                            </TableCell>
                            <TableCell>
                              {pendingOrg.subscription_items &&
                              pendingOrg.subscription_items.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {pendingOrg.subscription_items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-1 text-xs"
                                    >
                                      <span className="font-medium truncate max-w-[120px]" title={item.product_name ?? item.price_id}>
                                        {item.product_name ?? "Unknown"}
                                      </span>
                                      <span className="text-muted-foreground font-mono text-[10px]">
                                        ({item.price_id.slice(-8)})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <Small className="text-muted-foreground">-</Small>
                              )}
                            </TableCell>
                            <TableCell>
                              {pendingOrg.next_invoice_date ? (
                                <div className="flex flex-col">
                                  <Small>
                                    {new Date(pendingOrg.next_invoice_date * 1000).toLocaleDateString()}
                                  </Small>
                                  {pendingOrg.next_invoice_amount !== null && (
                                    <Small className="text-muted-foreground">
                                      ${(pendingOrg.next_invoice_amount / 100).toFixed(2)}
                                    </Small>
                                  )}
                                </div>
                              ) : (
                                <Small className="text-muted-foreground">-</Small>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={stripeStatus.color}
                              >
                                {stripeStatus.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {pendingOrg.stripe_subscription_id ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openStripeSubscription(
                                      pendingOrg.stripe_subscription_id!
                                    );
                                  }}
                                >
                                  <ExternalLink size={14} />
                                </Button>
                              ) : (
                                <Small className="text-muted-foreground">-</Small>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(pendingOrg.id)}
                                {migrationStates[pendingOrg.id]?.error && (
                                  <Small className="text-red-500">
                                    {migrationStates[pendingOrg.id].error}
                                  </Small>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {isCancelled ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmSwitchToFreeOrg({
                                      id: pendingOrg.id,
                                      name: pendingOrg.name,
                                      tier: pendingOrg.tier,
                                    });
                                  }}
                                  disabled={
                                    migrationStates[pendingOrg.id]?.status ===
                                    "migrating"
                                  }
                                >
                                  {migrationStates[pendingOrg.id]?.status ===
                                  "migrating"
                                    ? "Switching..."
                                    : "Switch to Free"}
                                </Button>
                              ) : pendingOrg.stripe_status === "unpaid" ? (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      confirm(
                                        `Cancel subscription for "${pendingOrg.name}"? This will cancel the Stripe subscription.`
                                      )
                                    ) {
                                      cancelSubscriptionMutation.mutate(
                                        pendingOrg.id
                                      );
                                    }
                                  }}
                                  disabled={
                                    migrationStates[pendingOrg.id]?.status ===
                                    "migrating"
                                  }
                                >
                                  {migrationStates[pendingOrg.id]?.status ===
                                  "migrating"
                                    ? "Cancelling..."
                                    : "Cancel Sub"}
                                </Button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmMigrateOrg({
                                        id: pendingOrg.id,
                                        name: pendingOrg.name,
                                        tier: pendingOrg.tier,
                                        migrationType: "instant",
                                      });
                                    }}
                                    disabled={
                                      migrationStates[pendingOrg.id]?.status ===
                                      "migrating"
                                    }
                                  >
                                    {migrationStates[pendingOrg.id]?.status ===
                                    "migrating"
                                      ? "..."
                                      : "Now"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-purple-100 text-purple-800 hover:bg-purple-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmMigrateOrg({
                                        id: pendingOrg.id,
                                        name: pendingOrg.name,
                                        tier: pendingOrg.tier,
                                        migrationType: "instant",
                                        targetTier: "team",
                                      });
                                    }}
                                    disabled={
                                      migrationStates[pendingOrg.id]?.status ===
                                      "migrating"
                                    }
                                  >
                                    Team
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmMigrateOrg({
                                        id: pendingOrg.id,
                                        name: pendingOrg.name,
                                        tier: pendingOrg.tier,
                                        migrationType: "scheduled",
                                      });
                                    }}
                                    disabled={
                                      migrationStates[pendingOrg.id]?.status ===
                                      "migrating"
                                    }
                                  >
                                    Schedule
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  <div className="mt-4 flex items-center justify-between">
                    <Muted>
                      Showing {pendingPage * PAGE_SIZE + 1} -{" "}
                      {Math.min(
                        (pendingPage + 1) * PAGE_SIZE,
                        pendingQuery.data?.summary?.total ?? 0,
                      )}{" "}
                      of {pendingQuery.data?.summary?.total ?? 0}
                    </Muted>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPendingPage((p) => Math.max(0, p - 1))
                        }
                        disabled={pendingPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingPage((p) => p + 1)}
                        disabled={!pendingQuery.data?.hasMore}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Migrated Organizations</CardTitle>
              <CardDescription>
                These organizations have been successfully migrated to new
                pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : completedQuery.data?.organizations?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Clock className="mb-2 h-12 w-12" />
                  <P>No organizations have been migrated yet</P>
                </div>
              ) : (
                <>
                  <BatchActionBar
                    tab="completed"
                    selectedIds={selectedCompletedIds}
                    batchProcessing={batchProcessing}
                    openStripeOnBatch={openStripeOnBatch}
                    setOpenStripeOnBatch={setOpenStripeOnBatch}
                    onStop={stopBatchMigration}
                    onClear={clearBatchResults}
                    onRunBatch={(migrationType) => {
                      runBatchMigration(
                        Array.from(selectedCompletedIds),
                        migrationType,
                        "completed",
                        openStripeOnBatch,
                        buildSubscriptionIdMap(completedQuery.data?.organizations)
                      );
                    }}
                    isReapply
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={
                              (completedQuery.data?.organizations?.length ?? 0) > 0 &&
                              completedQuery.data?.organizations?.every((org) =>
                                selectedCompletedIds.has(org.id)
                              )
                            }
                            onCheckedChange={() =>
                              toggleAllCompleted(
                                completedQuery.data?.organizations || []
                              )
                            }
                          disabled={batchProcessing?.isRunning}
                        />
                      </TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Trial</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Next Invoice</TableHead>
                      <TableHead>Stripe Sub</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedQuery.data?.organizations?.map((completedOrg) => (
                      <TableRow
                        key={completedOrg.id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedCompletedIds.has(completedOrg.id)
                            ? "bg-primary/5"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedOrg(completedOrg as OrgDetails)
                        }
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedCompletedIds.has(completedOrg.id)}
                            onCheckedChange={() =>
                              toggleCompletedSelection(completedOrg.id)
                            }
                            disabled={batchProcessing?.isRunning}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {completedOrg.name}
                              </div>
                              <a
                                href={`/organizations/${completedOrg.id}`}
                                className="text-xs text-muted-foreground hover:underline"
                              >
                                {completedOrg.id}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Small>{completedOrg.owner_email ?? "-"}</Small>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getTierBadgeColor(completedOrg.tier)}
                          >
                            {completedOrg.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Small className="text-muted-foreground">
                            {completedOrg.created_at
                              ? new Date(completedOrg.created_at).toLocaleDateString()
                              : "-"}
                          </Small>
                        </TableCell>
                        <TableCell>
                          {completedOrg.stripe_status === "trialing" ? (
                            <Badge
                              variant="secondary"
                              className="bg-amber-100 text-amber-800"
                            >
                              Trial
                              {completedOrg.trial_end && (
                                <span className="ml-1">
                                  → {new Date(completedOrg.trial_end * 1000).toLocaleDateString()}
                                </span>
                              )}
                            </Badge>
                          ) : (
                            <Small className="text-muted-foreground">-</Small>
                          )}
                        </TableCell>
                        <TableCell>
                          {completedOrg.subscription_items &&
                          completedOrg.subscription_items.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {completedOrg.subscription_items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1 text-xs"
                                >
                                  <span className="font-medium truncate max-w-[120px]" title={item.product_name ?? item.price_id}>
                                    {item.product_name ?? "Unknown"}
                                  </span>
                                  <span className="text-muted-foreground font-mono text-[10px]">
                                    ({item.price_id.slice(-8)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Small className="text-muted-foreground">-</Small>
                          )}
                        </TableCell>
                        <TableCell>
                          {completedOrg.next_invoice_date ? (
                            <div className="flex flex-col">
                              <Small>
                                {new Date(completedOrg.next_invoice_date * 1000).toLocaleDateString()}
                              </Small>
                              {completedOrg.next_invoice_amount !== null && (
                                <Small className="text-muted-foreground">
                                  ${(completedOrg.next_invoice_amount / 100).toFixed(2)}
                                </Small>
                              )}
                            </div>
                          ) : (
                            <Small className="text-muted-foreground">-</Small>
                          )}
                        </TableCell>
                        <TableCell>
                          {completedOrg.stripe_subscription_id ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                openStripeSubscription(
                                  completedOrg.stripe_subscription_id!
                                );
                              }}
                            >
                              <ExternalLink size={14} />
                            </Button>
                          ) : (
                            <Small className="text-muted-foreground">-</Small>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(completedOrg.id)}
                            {migrationStates[completedOrg.id]?.error && (
                              <Small className="text-red-500">
                                {migrationStates[completedOrg.id].error}
                              </Small>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmReapplyOrg({
                                  id: completedOrg.id,
                                  name: completedOrg.name,
                                  tier: completedOrg.tier,
                                  migrationType: "instant",
                                });
                              }}
                              disabled={
                                migrationStates[completedOrg.id]?.status ===
                                "migrating"
                              }
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              {migrationStates[completedOrg.id]?.status ===
                              "migrating"
                                ? "..."
                                : "Now"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmReapplyOrg({
                                  id: completedOrg.id,
                                  name: completedOrg.name,
                                  tier: completedOrg.tier,
                                  migrationType: "scheduled",
                                });
                              }}
                              disabled={
                                migrationStates[completedOrg.id]?.status ===
                                "migrating"
                              }
                            >
                              Schedule
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Organization Detail Sheet */}
      <Sheet open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedOrg?.name}
            </SheetTitle>
            <SheetDescription>
              Organization details and metered usage management
            </SheetDescription>
          </SheetHeader>

          {selectedOrg && (
            <div className="mt-6 flex flex-col gap-6">
              {/* Org Info */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Muted>ID</Muted>
                  <Small className="font-mono">{selectedOrg.id}</Small>
                </div>
                <div className="flex justify-between">
                  <Muted>Tier</Muted>
                  <Badge
                    variant="secondary"
                    className={getTierBadgeColor(selectedOrg.tier)}
                  >
                    {selectedOrg.tier}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <Muted>Owner</Muted>
                  <Small>{selectedOrg.owner_email ?? "-"}</Small>
                </div>
                {selectedOrg.stripe_customer_id && (
                  <div className="flex items-center justify-between">
                    <Muted>Stripe Customer</Muted>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() =>
                        openStripeCustomer(selectedOrg.stripe_customer_id!)
                      }
                    >
                      View Customer
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )}
                {selectedOrg.stripe_subscription_id && (
                  <div className="flex items-center justify-between">
                    <Muted>Stripe Subscription</Muted>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() =>
                        openStripeSubscription(
                          selectedOrg.stripe_subscription_id!,
                        )
                      }
                    >
                      View Subscription
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Add Usage Section - Only for new tier orgs */}
              {(selectedOrg.tier === "pro-20251210" ||
                selectedOrg.tier === "team-20251210") && (
                <div className="border-t pt-6">
                  <h4 className="mb-4 font-medium">Add Metered Usage</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Usage Type</Label>
                      <Select
                        value={usageType}
                        onValueChange={(v) =>
                          setUsageType(v as "requests" | "storage_gb")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="requests">Requests</SelectItem>
                          <SelectItem value="storage_gb">
                            Storage (GB)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        placeholder={
                          usageType === "requests" ? "e.g., 10000" : "e.g., 5"
                        }
                        value={usageQuantity}
                        onChange={(e) => setUsageQuantity(e.target.value)}
                      />
                      <Muted className="text-xs">
                        {usageType === "requests"
                          ? "Number of requests to add"
                          : "Number of GB to add"}
                      </Muted>
                    </div>
                    <Button
                      onClick={handleAddUsage}
                      disabled={!usageQuantity || addUsageMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {addUsageMutation.isPending ? "Adding..." : "Add Usage"}
                    </Button>
                    {addUsageMutation.isSuccess && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        Usage added successfully
                      </div>
                    )}
                    {addUsageMutation.isError && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {addUsageMutation.error instanceof Error
                          ? addUsageMutation.error.message
                          : "Failed to add usage"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Migration Confirmation Dialog */}
      <AlertDialog
        open={!!confirmMigrateOrg}
        onOpenChange={() => setConfirmMigrateOrg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmMigrateOrg?.migrationType === "instant"
                ? "Migrate Now"
                : "Schedule Migration"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                {confirmMigrateOrg?.migrationType === "instant"
                  ? "Migrate immediately with usage backfill for "
                  : "Schedule migration for next billing period for "}
                <strong>{confirmMigrateOrg?.name}</strong>?
              </p>
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={getTierBadgeColor(confirmMigrateOrg?.tier ?? "")}
                  >
                    {confirmMigrateOrg?.tier}
                  </Badge>
                  <ArrowRight className="h-4 w-4" />
                  <Badge
                    variant="secondary"
                    className={getTierBadgeColor(
                      getTargetTier(confirmMigrateOrg?.tier ?? ""),
                    )}
                  >
                    {getTargetTier(confirmMigrateOrg?.tier ?? "")}
                  </Badge>
                </div>
              </div>
              {confirmMigrateOrg?.migrationType === "instant" ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    This will immediately update their Stripe subscription and
                    backfill metered usage events (requests + storage) from the
                    billing period start.
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Note: Usage will be queried from ClickHouse automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    This will create a Stripe subscription schedule to change
                    pricing at the next billing period.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    No usage backfill needed - metered billing starts fresh.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmMigrateOrg &&
                handleMigrate(
                  confirmMigrateOrg.id,
                  confirmMigrateOrg.migrationType,
                  confirmMigrateOrg.targetTier,
                )
              }
            >
              {confirmMigrateOrg?.targetTier === "team"
                ? "Migrate to Team Now"
                : confirmMigrateOrg?.migrationType === "instant"
                  ? "Migrate Now"
                  : "Schedule Migration"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reapply Confirmation Dialog */}
      <AlertDialog
        open={!!confirmReapplyOrg}
        onOpenChange={() => setConfirmReapplyOrg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmReapplyOrg?.migrationType === "instant"
                ? "Reapply Now"
                : "Schedule Reapply"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                {confirmReapplyOrg?.migrationType === "instant"
                  ? "Reapply immediately with usage backfill for "
                  : "Schedule reapply for next billing period for "}
                <strong>{confirmReapplyOrg?.name}</strong>?
              </p>
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={getTierBadgeColor(confirmReapplyOrg?.tier ?? "")}
                  >
                    {confirmReapplyOrg?.tier}
                  </Badge>
                  <RotateCcw className="h-4 w-4" />
                  <span className="text-muted-foreground">Reapply</span>
                </div>
              </div>
              {confirmReapplyOrg?.migrationType === "instant" ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    This will re-run the migration logic immediately and
                    backfill metered usage events from the billing period start.
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Note: Usage will be queried from ClickHouse automatically.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    This will create a Stripe subscription schedule to reapply
                    pricing at the next billing period.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    No usage backfill needed - metered billing starts fresh.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmReapplyOrg &&
                handleReapply(
                  confirmReapplyOrg.id,
                  confirmReapplyOrg.migrationType,
                )
              }
            >
              {confirmReapplyOrg?.migrationType === "instant"
                ? "Reapply Now"
                : "Schedule Reapply"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Switch to Free Confirmation Dialog */}
      <AlertDialog
        open={!!confirmSwitchToFreeOrg}
        onOpenChange={() => setConfirmSwitchToFreeOrg(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Free Tier</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to switch{" "}
                <strong>{confirmSwitchToFreeOrg?.name}</strong> to the free
                tier?
              </p>
              <div className="rounded-md bg-red-50 p-3 text-sm dark:bg-red-950/30">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={getTierBadgeColor(
                      confirmSwitchToFreeOrg?.tier ?? "",
                    )}
                  >
                    {confirmSwitchToFreeOrg?.tier}
                  </Badge>
                  <ArrowRight className="h-4 w-4" />
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-800"
                  >
                    free
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground">
                This organization&apos;s Stripe subscription is cancelled or not
                found. This will update their tier to free in the database.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmSwitchToFreeOrg &&
                handleSwitchToFree(confirmSwitchToFreeOrg.id)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Switch to Free
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audit Results Sheet - Full width */}
      <Sheet open={showAuditResults} onOpenChange={setShowAuditResults}>
        <SheetContent className="w-full max-w-none sm:max-w-none overflow-y-auto" side="right">
          <div className="mx-auto max-w-7xl">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <div>
                  <SheetTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Subscription Audit Results
                  </SheetTitle>
                  <SheetDescription>
                    Comparing Stripe subscriptions with organization database records
                    {auditResult?.timestamp && (
                      <span className="ml-2">
                        • Last run: {new Date(auditResult.timestamp).toLocaleString()}
                      </span>
                    )}
                  </SheetDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => auditMutation.mutate()}
                  disabled={auditMutation.isPending}
                >
                  {auditMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {auditMutation.isPending ? "Running..." : "Re-run Audit"}
                </Button>
              </div>
            </SheetHeader>

            {auditResult && (
              <div className="mt-6 flex flex-col gap-6">
                {/* Summary */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="rounded-lg border p-4">
                    <Muted>Active Subscriptions</Muted>
                    <div className="text-2xl font-bold">
                      {auditResult.summary.totalActiveSubscriptions}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <Muted>Mismatches Found</Muted>
                    <div className="text-2xl font-bold text-orange-600">
                      {auditResult.summary.totalMismatches}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <Muted>Filtered (Legacy/Other)</Muted>
                    <div className="text-2xl font-bold text-slate-400">
                      {auditResult.summary.filteredOutEuUsers ?? 0}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <Muted>Match Rate</Muted>
                    <div className="text-2xl font-bold text-green-600">
                      {auditResult.summary.totalActiveSubscriptions > 0
                        ? `${Math.round(
                            ((auditResult.summary.totalActiveSubscriptions -
                              auditResult.summary.totalMismatches -
                              (auditResult.summary.filteredOutEuUsers ?? 0)) /
                              auditResult.summary.totalActiveSubscriptions) *
                              100
                          )}%`
                        : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Issues by type */}
                {Object.keys(auditResult.summary.byIssue).length > 0 && (
                  <div className="rounded-lg border p-4">
                    <Small className="font-medium">Issues by Type</Small>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(auditResult.summary.byIssue).map(
                        ([issue, count]) => (
                          <Badge
                            key={issue}
                            variant="secondary"
                            className="bg-orange-100 text-orange-800"
                          >
                            {issue}: {count}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Mismatches table */}
                {sortedMismatches.length > 0 ? (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleAuditSort("subscriptionId")}
                          >
                            <div className="flex items-center gap-1">
                              Subscription
                              {auditSortKey === "subscriptionId" ? (
                                auditSortDir === "asc" ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleAuditSort("customerEmail")}
                          >
                            <div className="flex items-center gap-1">
                              Customer
                              {auditSortKey === "customerEmail" ? (
                                auditSortDir === "asc" ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleAuditSort("stripeStatus")}
                          >
                            <div className="flex items-center gap-1">
                              Stripe Status
                              {auditSortKey === "stripeStatus" ? (
                                auditSortDir === "asc" ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleAuditSort("orgName")}
                          >
                            <div className="flex items-center gap-1">
                              Org
                              {auditSortKey === "orgName" ? (
                                auditSortDir === "asc" ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleAuditSort("issue")}
                          >
                            <div className="flex items-center gap-1">
                              Issue
                              {auditSortKey === "issue" ? (
                                auditSortDir === "asc" ? (
                                  <ArrowUp className="h-3 w-3" />
                                ) : (
                                  <ArrowDown className="h-3 w-3" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-30" />
                              )}
                            </div>
                          </TableHead>
                          <TableHead>User Orgs</TableHead>
                          <TableHead>Metadata</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedMismatches.map((mismatch) => (
                          <TableRow key={mismatch.subscriptionId}>
                            <TableCell>
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 font-mono text-xs"
                                onClick={() =>
                                  openStripeSubscription(mismatch.subscriptionId)
                                }
                              >
                                {mismatch.subscriptionId.slice(-12)}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </Button>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <Small>{mismatch.customerEmail ?? "-"}</Small>
                                <Muted className="font-mono text-[10px]">
                                  {mismatch.customerId.slice(-12)}
                                </Muted>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  getStripeStatusBadge(mismatch.stripeStatus).color
                                }
                              >
                                {mismatch.stripeStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {mismatch.orgId ? (
                                <div className="flex flex-col">
                                  <Small>{mismatch.orgName}</Small>
                                  <div className="flex items-center gap-1">
                                    <Badge
                                      variant="secondary"
                                      className={getTierBadgeColor(
                                        mismatch.orgTier ?? ""
                                      )}
                                    >
                                      {mismatch.orgTier}
                                    </Badge>
                                    <Muted className="text-[10px]">
                                      ({mismatch.orgSubscriptionStatus})
                                    </Muted>
                                  </div>
                                </div>
                              ) : (
                                <Muted>No org found</Muted>
                              )}
                            </TableCell>
                            <TableCell>
                              <Small className="text-orange-600">
                                {mismatch.issue}
                              </Small>
                            </TableCell>
                            <TableCell>
                              {mismatch.isInAuthUsers ? (
                                <div className="flex flex-col gap-1">
                                  {mismatch.userOrgs.length > 0 ? (
                                    mismatch.userOrgs.map((uo, idx) => (
                                      <div key={idx} className="flex items-center gap-1">
                                        <Small className="max-w-[120px] truncate">
                                          {uo.name}
                                        </Small>
                                        <Badge
                                          variant="secondary"
                                          className={`text-[10px] ${getTierBadgeColor(uo.tier)}`}
                                        >
                                          {uo.tier}
                                        </Badge>
                                      </div>
                                    ))
                                  ) : (
                                    <Muted className="text-[10px]">No orgs</Muted>
                                  )}
                                </div>
                              ) : (
                                <Muted className="text-[10px]">Not in auth.users</Muted>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      mismatch.orgHasCustomerId
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }`}
                                  />
                                  <Muted className="text-[10px]">customer_id</Muted>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      mismatch.orgHasSubscriptionId
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }`}
                                  />
                                  <Muted className="text-[10px]">subscription_id</Muted>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {/* Fix Tier button - show for "free tier but active sub" issue */}
                                {mismatch.issue.includes("free tier") &&
                                  mismatch.orgId && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() =>
                                        fixTierMutation.mutate({
                                          orgId: mismatch.orgId!,
                                          subscriptionId: mismatch.subscriptionId,
                                        })
                                      }
                                      disabled={fixTierMutation.isPending}
                                    >
                                      <Wrench className="mr-1 h-3 w-3" />
                                      Fix Tier
                                    </Button>
                                  )}
                                {/* Fix Metadata button - show when org exists but missing IDs */}
                                {mismatch.orgId &&
                                  (!mismatch.orgHasCustomerId ||
                                    !mismatch.orgHasSubscriptionId) && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() =>
                                        fixMetadataMutation.mutate({
                                          orgId: mismatch.orgId!,
                                          customerId: mismatch.customerId,
                                          subscriptionId: mismatch.subscriptionId,
                                        })
                                      }
                                      disabled={fixMetadataMutation.isPending}
                                    >
                                      <Link className="mr-1 h-3 w-3" />
                                      Fix Metadata
                                    </Button>
                                  )}
                                {/* Show nothing if no fix available */}
                                {!mismatch.orgId && (
                                  <Muted className="text-[10px]">No org to fix</Muted>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle className="mb-2 h-12 w-12 text-green-500" />
                    <P>All subscriptions match database records!</P>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
