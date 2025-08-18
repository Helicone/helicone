import { P } from "@/components/ui/typography";
import { Col } from "../../layout/common/col";
import { useEffect, useState } from "react";
import RateLimitRuleModal from "./RateLimitRuleModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/components/layout/org/organizationContext";
import { $JAWN_API } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/private";
import useNotification from "@/components/shared/notification/useNotification";
import { logger } from "@/lib/telemetry/logger";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PiPlusBold } from "react-icons/pi";
import { Badge } from "@/components/ui/badge";
import { Trash2, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import LoadingAnimation from "@/components/shared/loadingAnimation";

type RateLimitRuleView = components["schemas"]["RateLimitRuleView"];
type UpdateRateLimitRuleParams =
  components["schemas"]["UpdateRateLimitRuleParams"];

interface RateLimitRulesViewProps {
  triggerOpenCreateModal?: number;
}

const RateLimitRulesView = (props: RateLimitRulesViewProps) => {
  const { triggerOpenCreateModal } = props;

  const org = useOrg();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RateLimitRuleView | null>(
    null,
  );
  const { setNotification } = useNotification();
  const queryClient = useQueryClient();

  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["rateLimits", org?.currentOrg?.id],
    queryFn: async () => {
      if (!org?.currentOrg?.id) {
        return null; // Or throw an error, depending on desired behavior
      }
      const response = await $JAWN_API.GET("/v1/rate-limits");
      return response;
    },
    enabled: !!org?.currentOrg?.id,
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const resp = await $JAWN_API.DELETE("/v1/rate-limits/{ruleId}", {
        params: {
          path: { ruleId },
        },
      });
      if (resp.data?.error) {
        throw new Error(resp.data.error);
      }
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rateLimits", org?.currentOrg?.id],
      });
    },
    // onError handled by try/catch in handleDelete
  });

  // Effect to open create modal when trigger prop changes
  useEffect(() => {
    if (triggerOpenCreateModal && triggerOpenCreateModal > 0) {
      setIsCreateModalOpen(true);
    }
  }, [triggerOpenCreateModal]);

  const rules = data?.data?.data;
  const apiError = data?.data?.error;
  const networkError = error;

  // Helper function to determine segment priority level
  const getSegmentPriorityLevel = (
    segment: string | undefined | null,
  ): number => {
    if (segment && segment !== "user") {
      return 1; // Property
    } else if (segment === "user") {
      return 2; // User
    } else {
      return 3; // Global
    }
  };

  // Helper function to calculate restrictiveness (lower is more restrictive)
  const calculateRestrictiveness = (rule: RateLimitRuleView): number => {
    if (rule.window_seconds <= 0) {
      return rule.quota > 0 ? -Infinity : Infinity; // Treat 0 window as ultra-restrictive if quota > 0
    }
    // We don't need to multiply by 60 if we just compare relative restrictiveness
    return rule.quota / rule.window_seconds;
  };

  // Sort rules: 1. Segment Priority, 2. Restrictiveness (if units match), 3. Name
  const sortedRules = rules
    ? [...rules].sort((a, b) => {
        const priorityA = getSegmentPriorityLevel(a.segment);
        const priorityB = getSegmentPriorityLevel(b.segment);

        if (priorityA !== priorityB) {
          return priorityA - priorityB; // Sort by segment level (1, 2, 3)
        }

        // If segment levels are the same, compare restrictiveness only if units also match
        if (a.unit === b.unit) {
          const restrictivenessA = calculateRestrictiveness(a);
          const restrictivenessB = calculateRestrictiveness(b);
          if (restrictivenessA !== restrictivenessB) {
            return restrictivenessA - restrictivenessB; // Sort by restrictiveness (lower is more restrictive)
          }
        }

        // Fallback to sorting by name
        return a.name.localeCompare(b.name);
      })
    : [];

  const handleModalSuccess = (rule: RateLimitRuleView) => {
    const message = editingRule
      ? `Successfully updated rate limit rule "${rule.name}"`
      : `Successfully created rate limit rule "${rule.name}"`;
    setNotification(message, "success");
    if (editingRule) {
      setEditingRule(null);
    }
  };

  const handleDelete = async (ruleId: string, ruleName: string) => {
    // Confirmation is now handled by AlertDialog
    try {
      await deleteRuleMutation.mutateAsync(ruleId);
      setNotification(
        `Successfully deleted rate limit rule "${ruleName}"`,
        "success",
      );
    } catch (error) {
      // Log the actual error object for debugging
      logger.error({ error }, "Failed to delete rate limit rule");
      setNotification(
        `Failed to delete rule: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
      );
    }
  };

  return (
    <Col>
      <div className="flex flex-col gap-6">
        {isLoading && <LoadingAnimation />}

        {(isError || apiError) && (
          <div className="flex flex-col items-center justify-center gap-4 bg-destructive/10 text-destructive">
            <P className="text-center font-semibold">Error fetching rules</P>
            <P className="text-center text-xs">
              {networkError?.message ||
                apiError ||
                "An unknown error occurred."}
            </P>
          </div>
        )}

        {!isLoading &&
          !isError &&
          !apiError &&
          (!rules || rules.length === 0) && (
            <div className="flex flex-col items-center justify-center gap-4 bg-muted p-6 dark:bg-muted/50">
              <P className="text-center text-muted-foreground">
                No rate limits defined yet. Create your first rate limit rule to
                get started.
              </P>
            </div>
          )}

        {!isLoading &&
          !isError &&
          !apiError &&
          sortedRules &&
          sortedRules.length > 0 && (
            <div className="overflow-hidden bg-card shadow-sm dark:border-slate-800">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-b border-border hover:bg-transparent dark:border-slate-800">
                      <TableHead className="border-r border-border px-4 py-2.5 text-sm font-semibold">
                        Name
                      </TableHead>
                      <TableHead className="border-r border-border px-4 py-2.5 text-sm font-semibold">
                        Quota
                      </TableHead>
                      <TableHead className="border-r border-border px-4 py-2.5 text-sm font-semibold">
                        Unit
                      </TableHead>
                      <TableHead className="border-r border-border px-4 py-2.5 text-sm font-semibold">
                        Window (sec)
                      </TableHead>
                      <TableHead className="border-r border-border px-4 py-2.5 text-sm font-semibold">
                        Applies To
                      </TableHead>
                      <TableHead className="border-r border-border px-4 py-2.5 text-sm font-semibold">
                        Created
                      </TableHead>
                      <TableHead className="px-4 py-2.5 text-sm font-semibold last:border-r-0">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRules.map((rule) => {
                      let appliesToElement: React.ReactNode = (
                        <Badge variant="secondary">Global</Badge>
                      );
                      if (rule.segment === "user") {
                        appliesToElement = (
                          <Badge variant="default">User</Badge>
                        );
                      } else if (rule.segment) {
                        appliesToElement = (
                          <Badge variant="outline">{`Property: ${rule.segment}`}</Badge>
                        );
                      }

                      let unitElement: React.ReactNode = (
                        <Badge variant="outline">
                          {rule.unit === "request"
                            ? "Requests"
                            : rule.unit === "cents"
                              ? "Cents"
                              : rule.unit}
                        </Badge>
                      );

                      return (
                        <TableRow
                          key={rule.id}
                          className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/25 dark:border-slate-800/40"
                        >
                          <TableCell className="px-4 py-3 font-medium">
                            {rule.name}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {rule.quota.toLocaleString()}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {unitElement}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {rule.window_seconds.toLocaleString()}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {appliesToElement}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(rule.created_at).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRule(rule);
                                  setIsEditModalOpen(true);
                                }}
                              >
                                <Pencil size={15} className="text-blue-600" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    disabled={deleteRuleMutation.isPending}
                                  >
                                    <Trash2
                                      size={15}
                                      className="text-destructive"
                                    />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure you want to delete this rate
                                      limit rule?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will
                                      permanently delete the rate limit rule
                                      <strong>{` "${rule.name}"`}</strong>.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(rule.id, rule.name);
                                      }}
                                      disabled={deleteRuleMutation.isPending}
                                    >
                                      {deleteRuleMutation.isPending
                                        ? "Deleting..."
                                        : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        <div className="items-right flex justify-end pr-4">
          <Button
            key="create-rate-limit-rule"
            onClick={() => setIsCreateModalOpen(true)}
            variant="action"
            size="sm"
            className="items-center gap-1"
          >
            <PiPlusBold className="h-3.5 w-3.5" />
            Create Rule
          </Button>
        </div>
      </div>

      <RateLimitRuleModal
        open={isCreateModalOpen || isEditModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setEditingRule(null);
          }
        }}
        onSuccess={handleModalSuccess}
        rule={editingRule ?? undefined}
      />
    </Col>
  );
};

export default RateLimitRulesView;
